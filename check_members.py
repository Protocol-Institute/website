#!/usr/bin/env python3
"""
Protocol Institute — session startup member check.

Run from repo root:
  python3 check_members.py

Reports:
  1. Pending membership requests (with triage suggestions)
  2. Approved members whose welcome email was not confirmed sent
  3. Summary of remaining manual actions
"""

import json
import re
import subprocess
import sys

# Events that strongly qualify someone for membership
STRONG_TAGS = {
    'tag_sop23':          'SoP \'23',
    'tag_sop24':          'SoP \'24',
    'tag_sop25':          'SoP \'25',
    'tag_ps25':           'Protocol School \'25',
    'tag_sig':            'SIG member',
    'tag_datus_nusas':    'Datus & Nusas workshop',
    'tag_khlongs_subaks': 'Khlongs & Subaks workshop',
}

MODERATE_TAGS = {
    'tag_protocolized_writer': 'Protocolized writer',
    'tag_protocol_kit':        'Protocol Kit',
}

WEAK_TAGS = {
    'tag_town_hall': 'Town Hall',
}


def query(sql):
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'pi-members', '--remote', '--command', sql],
        capture_output=True, text=True
    )
    output = result.stdout + result.stderr
    # Find the outermost JSON array by tracking bracket depth
    start = output.find('[')
    if start == -1:
        return []
    depth = 0
    for i, ch in enumerate(output[start:], start):
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(output[start:i+1])
                    return data[0].get('results', [])
                except (json.JSONDecodeError, IndexError, KeyError):
                    return []
    return []


def triage(events):
    """Return ('APPROVE', reasons) or ('REVIEW', reasons) based on qualifying events."""
    strong = [STRONG_TAGS[e] for e in events if e in STRONG_TAGS]
    moderate = [MODERATE_TAGS[e] for e in events if e in MODERATE_TAGS]
    weak = [WEAK_TAGS[e] for e in events if e in WEAK_TAGS]
    all_labels = strong + moderate + weak
    if strong:
        return 'APPROVE', all_labels
    elif moderate or weak:
        return 'REVIEW', all_labels
    else:
        return 'REVIEW', ['no recognised qualifying events']


def section(title):
    print(f'\n{"─" * 60}')
    print(f'  {title}')
    print(f'{"─" * 60}')


def main():
    print('\n╔══════════════════════════════════════════════════════════╗')
    print('║   Protocol Institute — Member Directory Startup Check   ║')
    print('╚══════════════════════════════════════════════════════════╝')

    # ── 1. Pending requests ───────────────────────────────────────
    section('PENDING MEMBERSHIP REQUESTS')

    pending = query("""
        SELECT email, name, city, discord_handle, qualifying_events, applicant_notes, created_at
        FROM membership_requests
        WHERE status = 'pending'
        ORDER BY created_at ASC
    """)

    actions_needed = []

    if not pending:
        print('\n  ✓ No pending requests.')
    else:
        print(f'\n  {len(pending)} pending application{"s" if len(pending) != 1 else ""}:\n')
        approvals = []
        reviews = []

        for r in pending:
            events = json.loads(r.get('qualifying_events') or '[]')
            verdict, labels = triage(events)
            entry = {**r, 'verdict': verdict, 'labels': labels, 'events': events}
            (approvals if verdict == 'APPROVE' else reviews).append(entry)

        if approvals:
            print(f'  Suggested APPROVE ({len(approvals)}):')
            for r in approvals:
                city = f" · {r['city']}" if r.get('city') else ''
                discord = f" · Discord: {r['discord_handle']}" if r.get('discord_handle') else ''
                tags = ', '.join(r['labels'])
                print(f"    ✓  {r['name']} <{r['email']}>{city}{discord}")
                print(f"       Qualifies via: {tags}")
                if r.get('applicant_notes'):
                    print(f"       Note: {r['applicant_notes'][:120]}")
            print()

        if reviews:
            print(f'  Needs MANUAL REVIEW ({len(reviews)}):')
            for r in reviews:
                city = f" · {r['city']}" if r.get('city') else ''
                discord = f" · Discord: {r['discord_handle']}" if r.get('discord_handle') else ''
                tags = ', '.join(r['labels'])
                print(f"    ?  {r['name']} <{r['email']}>{city}{discord}")
                print(f"       Qualifying basis: {tags}")
                if r.get('applicant_notes'):
                    print(f"       Note: {r['applicant_notes'][:120]}")
            print()

        if len(pending) <= 10:
            actions_needed.append(f'{len(pending)} pending request{"s" if len(pending) != 1 else ""} to process at /admin/members')

    # ── 2. Email delivery check ───────────────────────────────────
    section('WELCOME EMAIL STATUS (approved members)')

    unsent = query("""
        SELECT name, email, created_at
        FROM members
        WHERE type = 'human'
        AND is_public = 1
        AND welcome_sent = 0
        ORDER BY created_at DESC
    """)

    if not unsent:
        print('\n  ✓ All approved members have confirmed welcome emails.')
    else:
        print(f'\n  ✗ {len(unsent)} member{"s" if len(unsent) != 1 else ""} approved but welcome email NOT confirmed sent:\n')
        for m in unsent:
            print(f"    • {m['name']} <{m['email']}> (approved {m['created_at'][:10]})")

        print('\n  To resend, run:')
        for m in unsent:
            print(f"    python3 check_members.py --resend {m['email']}")

        actions_needed.append(f'{len(unsent)} welcome email{"s" if len(unsent) != 1 else ""} need resending')

    # ── 3. Summary ────────────────────────────────────────────────
    section('SUMMARY')

    if not actions_needed:
        print('\n  ✓ Nothing requires attention.\n')
    else:
        print(f'\n  {len(actions_needed)} item{"s" if len(actions_needed) != 1 else ""} require action:\n')
        for i, a in enumerate(actions_needed, 1):
            print(f'  {i}. {a}')
        print()


def resend(email):
    """Resend welcome email for a single member via the admin API."""
    import urllib.request

    key_file = '../.env.keys'
    admin_key = None
    try:
        for line in open(key_file):
            if line.startswith('WEBSITE_ADMIN_KEY='):
                admin_key = line.strip().split('=', 1)[1]
                break
    except FileNotFoundError:
        pass

    if not admin_key:
        print('Error: could not read WEBSITE_ADMIN_KEY from ../.env.keys')
        sys.exit(1)

    payload = json.dumps({'email': email, 'action': 'resend_welcome'}).encode()
    req = urllib.request.Request(
        'https://protocol-institute.org/api/admin/members',
        data=payload,
        headers={
            'Authorization': f'Bearer {admin_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    if result.get('ok'):
        print(f'✓ Welcome email resent to {email}')
        # Mark welcome_sent in D1
        subprocess.run([
            'npx', 'wrangler', 'd1', 'execute', 'pi-members', '--remote',
            '--command', f"UPDATE members SET welcome_sent = 1 WHERE email = '{email}'"
        ], capture_output=True)
        print(f'✓ welcome_sent flag updated in D1')
    else:
        print(f'✗ Failed: {result}')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--resend':
        resend(sys.argv[2])
    else:
        main()

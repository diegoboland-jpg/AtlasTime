# Kikroo beta privacy notice

**Draft date:** 2026-08-17
**Applies to:** invited Kikroo beta testers using the hosted PWA or an internal mobile build.
**Controller:** DIEGO BOLAND AUSILIO CONSULTORIA EM TECNOLOGIA DA INFORMACAO LTDA, Brazil
**Privacy/support contact:** support@kikroo.com
**Publication status:** protected-beta notice; jurisdiction-specific rights wording, subprocessors, operational-log retention, and change-notification process must be completed before a public store release.

## Beta purpose

Kikroo helps people compare local times, working hours, and optional busy/free calendar blocks to plan a meeting. Beta participation is voluntary. Testers should use sample or low-sensitivity information and should not enter confidential employer, health, financial, or legal information.

## Information kept in the tester's browser

Kikroo stores groups, names or labels, locations, time zones, working hours, optional contact details, meeting drafts, preferences, and imported contacts in the current browser's local storage. This information is not synchronized to a Kikroo account because the beta has no Kikroo account system.

Clearing site data, changing browser profile, or uninstalling without preserving browser data may remove it.

## Information sent to external services

- Location-search text is sent to the configured geocoding provider to resolve a city and IANA time zone.
- Opening Google, Outlook, messaging, or videoconference actions sends information to the provider chosen by the tester under that provider's terms.
- When a tester explicitly connects Google or Microsoft Calendar, the provider authorizes Kikroo to request the minimum supported calendar access. Kikroo's planning view is designed to use occupied/free periods rather than event titles or descriptions.

## Hosted availability requests

If a tester creates or accepts a private availability-request link, Kikroo's server stores an opaque token record, expiry/status information, selected provider state, and shared busy/free time intervals. These records are encrypted at rest. The recipient chooses whether to share and can revoke or let the link expire. Event titles and descriptions are not requested for this feature.

Calendar authorization material is kept in encrypted, secure cookies scoped to the corresponding calendar gateway. Disconnecting asks the provider to revoke access where supported and clears Kikroo's connection cookie.

Availability links default to seven days and are limited by the current service to a maximum of fourteen days. After expiry, the service no longer returns the shared busy/free blocks. Expired records are pruned when a later request is created; immediate physical deletion at the expiry instant is not yet guaranteed. A scheduled deletion policy and the hosting provider's operational-log retention must be approved before a public-store release.

## Group-sharing links

A portable group-sharing link contains a snapshot in the URL fragment. Anyone receiving that link may read the included group name, people/team labels, emails, locations, time zones, working hours, and meeting details. Create and send such a link only with the affected people's permission.

## Beta diagnostics and feedback

Do not include contact lists, calendar screenshots, access tokens, encryption keys, private links, or sensitive meeting text in feedback. Crop screenshots where possible. Kikroo does not currently run behavioral advertising or an analytics profile system.

## Tester controls

Testers can edit or remove local people and groups, disconnect calendar providers, revoke availability-request links, clear the browser's site data, or uninstall the PWA. Provider-side authorizations may also be revoked from the relevant Google or Microsoft account settings.

## Security and limitations

The hosted beta uses HTTPS and encrypted server records for the connected sharing functions described above. No beta is risk-free. Testers must not treat Kikroo as the only record of an important appointment or as a guarantee that a participant is available.

## Required publication decisions

Before this notice is linked from a public store listing, add or confirm:

- applicable jurisdiction and any legally required rights/process;
- scheduled deletion period for expired hosted availability records and the hosting provider's operational-log retention;
- current subprocessors/hosting providers;
- effective date and change-notification method.

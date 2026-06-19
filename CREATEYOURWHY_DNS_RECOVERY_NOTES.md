# createyourwhy.com DNS / AWS — Situation & Next Steps
_Notes from 2026-06-18. No passwords or keys are stored in this file on purpose._

## The goal
Add a subdomain **inklings.createyourwhy.com → `careerswipe.netlify.app`** (a CNAME) so the Inklings app
has a branded URL. Everything is blocked on one thing: **access to the DNS.**

## The blocker (root cause)
The DNS for **createyourwhy.com** lives in **AWS Route 53**, inside an AWS account we are **locked out of**.

## Account map
- **968345359361** — "Create Your Why", the **management account** of AWS Org `o-wdh199dden`.
  Root email = **kevin@createyourwhy.com**. You CAN get in (SSO/passkey), **but it has NO Route 53 zones.**
- **569567741855** — standalone account created **Apr 2023**, IAM user `createyourwhy_aws_user`.
  **This is where the createyourwhy.com DNS zone lives.** Currently **LOCKED OUT**:
  - IAM user password (in the old AWS CSV) — **dead/rotated**.
  - IAM access keys (in the old AWS CSV) — **dead/rotated**.
  - Root **email is unknown** (it is NOT kevinglavin@gmail.com, admin@, or kevin@createyourwhy.com).
  - There IS a root **passkey** ("569567741855-root-Laptop") in Google Password Manager, but it can't be
    used without first knowing the root email (AWS root sign-in asks for the email first).
  - Account was **flagged for possible third-party compromise in Nov 2025** (AWS case **176245576900234**),
    nearly terminated; credentials were rotated during that incident (that's why the old ones are dead).
- **admin@createyourwhy.com** = an **AWS Builder ID** (a personal sign-in for AWS community/training tools).
  This is **NOT** an account root — that's why it gave "account does not exist" as a Root user.

## Registrar & nameservers
- Registrar: **DreamHost** (you control this). Domain createyourwhy.com.
- Nameservers (delegated to Route 53): `ns-124.awsdns-15.com`, `ns-542.awsdns-03.net`,
  `ns-1497.awsdns-59.org`, `ns-1608.awsdns-09.co.uk`.
- NOTE: DreamHost's DNS panel shows a **stale copy** of records that differs from what's live — do not trust it.

## Live DNS records (captured 2026-06-18 — needed for any migration)
- Apex `createyourwhy.com` A → **162.159.134.42** (Cloudflare)
- **MX → Google Workspace**: aspmx.l.google.com (1), alt1/alt2 (5), alt3/alt4 (10)  ← EMAIL; preserve exactly
- TXT SPF: `v=spf1 +a +mx +ip4:63.134.207.1/24 include:_spf.google.com ~all`
- TXT: `google-site-verification=3brGpPVTFvahHhoDCEkireI8spqLGTZMBQsJhcyAalw` (+ a couple of other verification tokens)
- `www` CNAME → createyourwhy.com ; `app`/`apps`/`pay`/`info`/`autodiscover` → A 162.159.134.42
- STILL TO CAPTURE before migrating: Google **DKIM** (`google._domainkey` TXT) and the 2 Google
  verification CNAMEs visible in the DreamHost panel. (No DMARC record currently exists.)

## Two ways to finish (pick one)
1. **Recover 569567741855 via AWS Support (submitted 2026-06-18).** Phone-verify ownership →
   restore root → then just add the `inklings` CNAME (1 minute). Keeps everything as-is. _Lowest DNS risk._
   - Submit at: https://support.aws.amazon.com/#/contacts/aws-account-support
   - Reference: Account 569567741855, case 176245576900234, phone +1 720 539 5372.
2. **Migrate DNS to an account you control** (968345359361, or Cloudflare which auto-imports). Recreate the
   zone (using the live records above), **verify it returns identical answers (esp. MX) before switching**,
   then repoint DreamHost's nameservers. Reversible (old zone stays). Also removes the locked-account risk.

## Security to-do once recovered
The likely compromise vector was **plaintext credentials stored in Dropbox** (the `WebSites/cyw4/Security_Files`
CSVs/docs). Rotate every secret that was in those files and stop keeping plaintext passwords/keys in Dropbox —
use a password manager only.

## Reassurance
Your **email is hosted by Google** (not AWS) and **you control the registrar (DreamHost)**. So even worst-case
you can NOT permanently lose email — at most a temporary delivery gap, fixable by repointing nameservers to a
new zone with the same MX records.

## The app itself — DONE
Inklings is fully built, hardened, bilingual, and **live at `careerswipe.netlify.app`** today. The custom
domain is the only outstanding (cosmetic) item.

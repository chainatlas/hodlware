# HODLWARE – Stripe Sandbox Integration

Stand: 02.10.2026. Ausschließlich lokal implementiert; nicht committed, gepusht oder deployed. Noch keine Freigabe für echten Verkauf. Reale Sandbox-End-to-End-Tests sind offen, weil keine Sandbox-Zugangsdaten/Price-ID/Webhook-Konfiguration bereitstehen.

## Architektur

Bestehende statische Website, ohne Framework-Wechsel. Cloudflare Pages Functions rufen das offizielle Stripe SDK auf. Browser sendet ausschließlich Produkt-ID `seedplate` und Menge (1–99). Alle zusätzlichen Preisfelder werden abgewiesen. Der Server verifiziert den aktiven Stripe-Testpreis auf einmalig 7900 EUR-Cent; DHL wird als separate Shipping Rate einmalig mit 619 EUR-Cent gesetzt. Lieferland DE, Rechnungsadresse erforderlich, E-Mail/Kundenname über Stripe Checkout. Zahlungsarten dynamisch gemäß Dashboard; keine eigene Zahlungsabwicklung.

Promotion Codes werden durch Stripe validiert. Der Rabatt betrifft die Produkt-Zwischensumme; Versand wird separat abgerechnet. Keine eigene Gutscheinberechnung. `invoice_creation.enabled` erstellt die Rechnung nach erfolgreicher Zahlung. Stripe Tax ist deaktiviert. Keine Steuersätze werden hinzugefügt.

HttpOnly/SameSite-Cookie bindet die Session an den anfordernden Browser. POST-Anfragen benötigen passenden Origin und JSON. Stripe-Idempotency-Key schützt wiederholte Checkout-Anfragen. Erfolg wird aus der serverseitig abgerufenen Stripe-Session geprüft, inklusive Testmodus, internem Metadatenkennzeichen, Browserbindung, Währung, Menge, Gesamtsumme und deutscher Versandadresse. Nur minimale Summen und ggf. ein HTTPS-Rechnungslink auf invoice.stripe.com gehen zurück. Eine Redirect-URL allein bestätigt keine Zahlung. Im anderen Browser ist der Status absichtlich nicht zugänglich; die Stripe-Rechnung bleibt über Stripe verfügbar.

Webhook verifiziert den unveränderten Body mit dem offiziellen SDK und WebCrypto-Provider. Bei temporären Stripe-/D1-Fehlern HTTP 503 für Stripe-Retries. Es wird die aktuelle Session abgefragt, damit verspätete Events nicht ungeprüft eine Bestellung bestätigen. D1 speichert nur Session-ID, Event-ID, Status und Aktualisierungszeit: keine Namen, Adressen oder E-Mails. Eindeutige Schlüssel und atomare Batches verhindern doppelte Bestelleinträge. `paid` kann durch verspätete Fehler nicht zurückgesetzt werden. IDs sind trotzdem als vertrauliche Betriebsdaten zu behandeln. Versandbearbeitung erfolgt manuell anhand Stripe; kein automatischer Versand und keine eigene Kundenverwaltung.

## Dateien

Geändert: `.gitignore` (lokale Konfiguration ausschließen, leere Beispielvariablen erlauben), `assets/app.js` (bestehenden Warenkorb robust laden und Checkout-Modul einbinden), `assets/style.css` (nur Warenkorb/Ergebnisseiten).

Neu:
- `assets/checkout.js`: Mengen, Summen, Rechtslinks, Testmodus, Checkout-Aufruf.
- `assets/checkout-result.js`: verifizierter Status, Rechnung, vorsichtiges Leeren des zugehörigen Warenkorbs.
- `checkout-success.html`, `checkout-cancel.html`: vorhandener Header/Footer, neue Checkout-Inhalte.
- `server/checkout.js`: serverseitige Validierung, Stripe, Signaturen, D1.
- `functions/api/checkout-context.js`, `create-checkout-session.js`, `checkout-status.js`, `stripe-webhook.js`: vier Routen.
- `migrations/0001_checkout.sql`: minimales D1-Schema.
- `scripts/build.mjs`: sauberer `dist`-Build mit fester Dateiliste. Weder Secrets noch Servercode, Tests oder node_modules werden als statische Dateien veröffentlicht.
- `tests/checkout.test.js`: 27 lokale Tests, teils mit ausdrücklich simulierten Stripe-Antworten.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`: gepinnte Stripe-/Wrangler-Abhängigkeiten und erlaubte Hersteller-Buildskripte.
- `.dev.vars.example`, `wrangler.local.example.jsonc`: Vorlagen ohne echte Zugangsdaten.
- `CHECKOUT-SETUP.md`: diese Anleitung.

Nur lokal erzeugt/ignoriert: `wrangler.jsonc`, `dist/`, `node_modules/`, `.wrangler/`. Keine `.dev.vars` mit Secrets angelegt. Alle bestehenden HTML-Seiten einschließlich Rechtstexte, Produktdaten, Bilder und Widerruf-JavaScript sind unverändert.

## Variablen und Bindings

| Name | Art | Wert |
| --- | --- | --- |
| STRIPE_SECRET_KEY | Cloudflare Secret | Secret-Key des passenden Stripe-Sandbox-Kontos, ausschließlich Testmodus |
| STRIPE_WEBHOOK_SECRET | Cloudflare Secret | Signatursecret des jeweiligen Sandbox-Webhook-Endpunkts; lokal das Secret des Stripe-CLI-Listeners |
| STRIPE_PRICE_ID | Variable | Aktiver einmaliger Sandbox-Preis über 79,00 EUR für dieses Produkt |
| SITE_URL | Variable | Lokal http://127.0.0.1:8788; später exakte HTTPS-Origin des jeweiligen Deployments, ohne Pfad |
| ORDERS | D1 Binding | Separate Testdatenbank mit Schema aus migrations/0001_checkout.sql |

Keine Publishable Keys nötig: Weiterleitung erfolgt zur serverseitig erzeugten Hosted-Checkout-URL. Live-Schlüssel werden abgewiesen. Secrets niemals in Git, Chat, Screenshots oder Befehlsargumente kopieren.

## Lokal weiter testen

Node 24 und pnpm 11.25.0 verwenden. Im Projekt:

```powershell
pnpm install --frozen-lockfile
Copy-Item wrangler.local.example.jsonc wrangler.jsonc
Copy-Item .dev.vars.example .dev.vars
pnpm db:local
pnpm build
pnpm test
pnpm dev
```

Die lokale wrangler.jsonc ist hier bereits erstellt und die Datenbank initialisiert. Die Copy-Befehle auf diesem Rechner nicht über bereits bearbeitete Konfigurationen ausführen. `.dev.vars` eigenständig in einem lokalen Editor befüllen, nicht im Chat. Vor jeder Vorschau von Frontend-Änderungen `pnpm build` erneut ausführen. Der bisherige reine Dateiserver auf Port 8766 führt keine Pages Functions aus; Checkout-Vorschau ist Port 8788.

Stripe CLI (falls installiert): im richtigen Sandbox-Konto anmelden, dann:

```text
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to http://127.0.0.1:8788/api/stripe-webhook
```

Das angezeigte Listener-Secret nur in `.dev.vars` eintragen. Danach Wrangler neu starten. Stripe CLI braucht Zugriff auf die richtige Sandbox; keine Zugangsdaten im Repository ablegen.

## Stripe Dashboard – manuell

1. Passende Sandbox auswählen. Aktiven einmaligen EUR-Preis 79,00 für das Produkt prüfen und dessen Price-ID als STRIPE_PRICE_ID verwenden. Bei produktbeschränktem HODL10 muss genau dieses Stripe-Produkt zum Coupon passen.
2. HODL10 prüfen: aktiv, 10 %, passende Gültigkeit/Einlösungsbedingungen. Ungültige Codes lehnt Stripe ab. Es werden keine Coupons angelegt.
3. Zahlungsmethoden für Hosted Checkout aktivieren: Karten sowie PayPal/Apple Pay/Google Pay, soweit im Konto verfügbar. Nicht gewünschte Kryptowährungs-/Stablecoin-Methoden deaktiviert lassen. Sichtbarkeit hängt auch von Gerät, Browser, Konto und Transaktion ab.
4. Geschäftsdaten, rechtliche URLs, Rechnungsangaben und vorhandenen Kleinunternehmerhinweis prüfen. Keine automatische Steuerberechnung und keine Default-Tax-Rates aktivieren.
5. Settings → Business → Customer emails → Successful payments für Rechnungs-/Zahlungs-E-Mails aktivieren. Testbelege werden nicht automatisch wie produktive Belege verschickt; bei Bedarf im Dashboard manuell senden. Post-Payment-Invoices können separat bepreist sein.
6. Nach freigegebenem Testdeployment unter Workbench/Webhooks einen Sandbox-Endpunkt `/api/stripe-webhook` für `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` anlegen. Dessen eigenes Signatursecret in Cloudflare setzen. Das CLI-Secret gilt nicht für den Dashboard-Endpunkt.
7. Nach Testkauf in Stripe die Zahlung, Versandadresse, Rabatt, Rechnungs-PDF und Lieferbetrag prüfen. Erfolgsredirect ersetzt keine Webhook-Prüfung.

## Cloudflare – erst nach separater Deployment-Freigabe

1. Für Sandbox-Prüfungen vorzugsweise separates Pages-Testprojekt/Preview verwenden, damit die freigegebene Website auf main unverändert online bleibt. Noch nichts gepusht/deployed.
2. Framework: None. Build: `pnpm build`. Build output directory: `dist`. Projektwurzel bleibt Repository-Wurzel; dort liegt `functions/`. Node 24 / pnpm 11.25.0 konfigurieren. Nicht das gesamte Repository als statisches Output veröffentlichen.
3. Separate D1-Testdatenbank anlegen; SQL aus `migrations/0001_checkout.sql` in dieser Datenbank ausführen. Binding `ORDERS` dem Pages-Testenvironment zuordnen.
4. Obige Secrets/Variablen im passenden Environment setzen, SITE_URL exakt passend zur Test-Origin. Für ein später genehmigtes Deployment auf hodlware.de ist es `https://hodlware.de`; keine Live-Schlüssel verwenden.
5. Compatibility date 2026-09-30 setzen. Lokale ignorierte wrangler.jsonc mit Null-ID niemals hochladen; Cloudflare-Einstellungen werden im Dashboard gepflegt.
6. Erst nach ausdrücklicher Freigabe committen/pushen. Nach Konfigurationsänderungen neu deployen. Anschließend reale Sandbox-Tests durchführen, Webhook-Antworten und D1-Status kontrollieren. Diese Umsetzung ist absichtlich noch keine Live-Zahlungsfreigabe.

## Endpunkte

Lokal Basis `http://127.0.0.1:8788`; nach genehmigtem Deployment entsprechende Test-Origin bzw. `https://hodlware.de`:

- GET `/api/checkout-context`: initialisiert Browserbindung.
- POST `/api/create-checkout-session`: erstellt die Stripe-Testsession.
- POST `/api/checkout-status`: serverseitig verifizierte Bestellübersicht.
- POST `/api/stripe-webhook`: ausschließlich signierte Stripe-Events.
- `/checkout-success.html` und `/checkout-cancel.html`: Stripe-Rückkehrseiten (Pages leitet ggf. auf URLs ohne .html um).

## Testergebnisse / offene Abnahme

27/27 automatisierte Tests bestanden. Static build und Cloudflare-Worker-Kompilierung bestanden; D1-Schema lokal ausgeführt. `pnpm audit --prod`: keine bekannten Schwachstellen. Git-Diff auf unerlaubte Änderungen geprüft, `git diff --check` ohne Fehler. Signaturbasierter Secret-Scan von nicht ignorierten Projektdateien und bestehender Git-Historie ohne Treffer; das ist keine Garantie, beliebige unbekannte Secrets erkennen zu können. Nur ausdrücklich synthetische Testwerte in Tests.

| Angeforderter Fall | Ergebnis |
| --- | --- |
| 1 Stück | Browser + Server-Test: 79,00 + 6,19 = 85,19 EUR |
| Mehrere Stück | Browser + Server-Test: 2 Stück = 164,19 EUR |
| Versand einmal | Geprüft, serverseitige separate Shipping Rate |
| HODL10 | SDK-Parameter und simulierte 10-%-Summen geprüft; tatsächlicher Sandbox-Code noch offen |
| Ungültiger Promo-Code | Von Stripe validiert; realer Checkout-Test offen |
| Erfolgreicher Stripe-Testkauf | Offen: Sandbox-Konfiguration fehlt |
| Abgebrochener Checkout | Lokale Abbruchseite/Rückkehr geprüft; Stripe-Redirect offen |
| Manipulierte ID/Menge/Preis | Automatisiert zurückgewiesen, inklusive Preisfeld vor Stripe-Aufruf |
| Ausland | DE-Allowlist und Ablehnung fremder Adresse geprüft; echte Stripe-Eingabemaske offen |
| Success ohne Session | Browser zeigt ausdrücklich keine Zahlungsbestätigung |
| Gültige bezahlte Session | Server mit simulierten Stripe-Daten geprüft; realer Testkauf offen |
| Falsche Webhook-Signatur | SDK und Handler weisen zurück |
| Retry/Duplikate | SQLite-Transaktionen, eindeutige IDs, verspätete Events und retryfähiger Fehler geprüft; echte Stripe-Zustellung offen |
| Mobile/Desktop | Warenkorb bei 390 × 844 und 1440 × 900 visuell geprüft |
| Navigation/Rechtsseiten | Linkziele vorhanden; vorhandene Dateien unverändert |
| Warenkorb | Hinzufügen, erhöhen, reduzieren, entfernen, leere Summen und Persistenz im Browser geprüft |

Für die abschließende Sandbox-Abnahme: im Checkout HODL10 testen (1 Stück: 77,29 EUR; 2 Stück: 148,39 EUR), ungültigen Code testen, deutsche Testadresse und offizielle Stripe-Testkartendaten verwenden, abbrechen sowie erfolgreich bezahlen. Rechnungs-PDF, Rabatt und einmaligen Versand kontrollieren. Webhook im Dashboard erneut zustellen und nur einen Bestelleintrag prüfen. Verzögerte Methode einschließlich Erfolg/Fehlschlag testen. Diese Schritte nicht als erledigt betrachten, bis reale Stripe-Testergebnisse vorliegen.

## Offizielle Referenzen

- https://docs.stripe.com/api/checkout/sessions/create
- https://docs.stripe.com/payments/checkout/discounts
- https://docs.stripe.com/receipts
- https://docs.stripe.com/webhooks
- https://developers.cloudflare.com/pages/functions/local-development/
- https://developers.cloudflare.com/pages/functions/bindings/

# HODLWARE – technischer Stand und verbleibende Freigaben

Stand: 11.10.2026. Pages nach ausdrücklicher Betreiberfreigabe veröffentlicht; kein Commit/Push. Keine echte Zahlung, keine Stripe-/DNS-Änderung, keine vorhandene Bestellung verändert. Keine Secret-Werte gelesen oder ausgegeben.

## Erreicht

- D1-Migration 0002 erfolgreich in hodlware-orders angewendet; Tabellen für Eingänge, Outbox, Ratenbegrenzung und Bestellbestätigungen vorhanden. ORDERS-Binding in Pages Production und Mail-Worker bestätigt.
- hodlware-mail-worker aktiv, Version bae0a63c-3331-4e26-903d-dbc4acd27478, Cron jede Minute. COMMUNICATIONS_ENABLED=true, MAIL_FROM=bestellungen@hodlware.de. Kein neues öffentliches Kontaktpostfach; Antworten an steffenreizner@web.de.
- RESEND_API_KEY in beiden Diensten vorhanden (nur Secret-Namen geprüft). RATE_LIMIT_SECRET neu mit 48 Zufallsbytes direkt als Pages-Secret hinterlegt, nicht als Datei. Bestehende Secrets unverändert.
- Resend: Domain/DKIM/SPF/Region EU-Ireland laut Betreiber verifiziert. Echtes Worker-/D1-/Resend-Smoke-Mailing und fünf gekennzeichnete technische Nachrichten an steffenreizner@web.de vom Anbieter angenommen.
- Fünf Flow-Nachrichten: Kontakt an Betreiber, Widerruf an Betreiber/Kunde, Bestellung an Betreiber/Kunde. Alle Empfänger auf das Betreiberpostfach begrenzt. Keine reale Bestellung oder Widerruf erzeugt. Formular-/Bestellaufträge zunächst durch Originalfunktionen mit In-Memory-SQLite erzeugt; ausschließlich technische Outbox-Jobs in Remote-D1 ergänzt.
- Retry: drei Formularjobs nach lokal simuliertem Anbieterausfall durch echten Remote-Cron erfolgreich versandt (attempts=2); zwei Bestelljobs attempts=1. Abschließende Abfrage: alle fünf sent, Provider-Annahme bestätigt, Versuchszähler unverändert. Betreiber hat den Eingang aller fünf Testmails im Postfach bestätigt; realer Zustelltest erfolgreich.
- Pages-Produktionskonfiguration über offiziellen Wrangler-Download geprüft: SITE_URL/STRIPE_PRICE_ID vorhanden, ORDERS korrekt. Zusätzliche MAIL_FROM-/Communication-/Form-/Order-/Worker-Schalter nur lokal zur späteren Freischaltung vorbereitet (.cache/pages-config/wrangler.prepared.jsonc); Preview standardmäßig deaktiviert. Kein Pages-Deployment. Bestehende Stripe-Konfiguration erhalten.

## Lokale Kundenfassung

- Interne Datenschutz-Prüfhinweise und alter Checkout-Entwicklerplatzhalter entfernt. Anbieterinformationen Cloudflare, Stripe, Resend und WEB.DE konkretisiert. Keine Behauptung über individuell bestätigte AV-Verträge/SCC. Regelmäßige manuelle Löschprüfung als vorgesehen beschrieben, kein erfundener bestehender/automatisierter Prozess.
- Vertragsschluss nach Betreiberfreigabe bei erfolgreicher Zahlung; versionierte AGB/Widerrufsunterlagen im Bestellmailtext. Archivierte Vertragsversionen bei künftigen Änderungen erhalten.
- Unbelegte Modellangaben lokal entfernt: 304, 105 × 60 × 6 mm, ca. 435 g, 6,5-mm-Öffnung, 1.455 °C / 2.654 °F und Feuer-/Wasserfestigkeitsversprechen. Bestellmail angepasst. Bestätigte 8 Zeichen, 12/18/24 Wörter, Offline-Aufbewahrung und Lieferumfang erhalten. Preise 79,00 / 6,19 unverändert.
- Antwortadresse für Kunden-Bestell- und Widerrufsbestätigungen auf bestehendes Betreiberpostfach gesetzt; kein neues Postfach erforderlich.
- Keine Telefonnummer/Steuernummer/ID erfunden. Keine sichtbaren internen Prüfhinweise im fertigen Build gefunden. Das ersetzt keine Klärung der nachstehenden echten Lücken.

## Finale Prüfungen

- pnpm test: 62 erfolgreich, 0 fehlgeschlagen. Ein vollständiger finaler Lauf. Einschließlich signierter simulierter Stripe-Webhooks, Live/Test-Trennung, Preis/Versand, D1-Transaktionen, Formularschutz, Retry, Parallelität, Rollback und Dublettenschutz. Wiederholte/verspätete Webhooks: ein Bestellnachweis, zwei Mailaufträge, keine erneute Übergabe.
- pnpm build erfolgreich; Pages-Functions zusätzlich erfolgreich kompiliert.
- Fertiger Build und Server-/Function-/Worker-Code: Secret-Musterscan 0 Treffer; interne Prüfhinweise 0 Treffer; oben entfernte Modellbehauptungen 0 Treffer. Keine Secret-Dateien gescannt. git diff --check ohne Fehler.
- Stripe ist laut Betreiber bereits LIVE und bleibt unverändert. Nicht nachgewiesen: neue Formulare im veröffentlichten Pages-Runtime, zusätzliche Leseberechtigungen des bestehenden restricted Live-Keys und ein vollständiger Zahlungsvorgang mit neuer Bestellmail. Letzterer bleibt einem später separat autorisierten kontrollierten Test vorbehalten; keine Umstellung auf Sandbox erforderlich. Keine echte Zahlung oder Secret-Auslesung vorgenommen.

## Verbleibende Veröffentlichungspunkte

1. Betreiber wünscht keine Telefonnummer. Fernabsatz-Pflichtinformationen einschließlich Telefon vor Freigabe klären (Art. 246a § 1 EGBGB). USt-ID/Register laut Betreiber nicht vorhanden; Wirtschafts-ID ungeklärt. Keine normale Steuernummer veröffentlichen. Nichtteilnahme an Verbraucherschlichtung bestätigt.
2. Produkt/GPSR: Produkt-/Chargenkennung, deutsche Anleitung/Sicherheitshinweise, Risikobewertung und Nachweise für das konkrete Modell fehlen. Auch Fertiger-/Lieferantendokumentation, Kennzeichnung und Rückverfolgbarkeit klären. Entfernte Material-/Maß-/Gewichts-/Temperaturwerte nur nach belastbarem Modellnachweis wieder aufnehmen; Edelstahl-Schmelzpunkt ist kein Feuerfestigkeitsnachweis.
3. Cloudflare/Stripe/Resend-Vertrags-/Datenschutzgrundlagen sowie WEB.DE-Tarif und geschäftliche Nutzung vom Betreiber noch ungeprüft. Diese manuellen Prüfungen nicht als abgeschlossen dargestellt. Löschzuständigkeit übernommen; Dokumentkategorien/Fristen und kontrolliertes Verfahren noch festlegen. Keine automatische Löschung von Bestellunterlagen.
4. Erledigt: Betreiber bestätigt Eingang aller fünf Testmails in steffenreizner@web.de.
5. Nach Freigabe: eingeschränkte Stripe-Leserechte für PaymentIntent mit expandiertem PaymentMethod prüfen, vorbereitete Pages-Konfiguration und Code gemeinsam veröffentlichen, Formular-/Bestellmailstatus gefahrlos prüfen. Kein unverifiziertes Aktivieren der Produktions-Bestellmail. Code benötigt zusätzlich paymentIntents.retrieve mit expand payment_method; bestehende Aufrufe bleiben prices.retrieve, checkout.sessions.create/retrieve und expand invoice. Kontospezifische Berechtigungen noch nicht bestätigt: Stripe-Einstellungen öffnen führt aktuell zur Anmeldung. Keine Keys anzeigen oder ändern; Prüfung nach Betreiberanmeldung fortsetzen.
6. Laufender Betrieb: Outbox pending/review und Resend-Bounces überwachen. Nach 23 Stunden seit erstem Versuch review statt blindem Wiederholen über das Provider-Idempotenzfenster hinaus. Bei unklarem Versandstatus erst Provider-Abgleich; kein unkontrollierter Neuversand. Altbestellungen nicht mit neuen Vertragsfassungen nachbestätigen.

## Ergebnis – finales Production-Deployment

- Betreiber hat die zuvor genannten manuellen Compliance-Punkte ausdrücklich als nicht blockierend für die heutige technische Veröffentlichung akzeptiert. Diese bleiben offen; keine rechtliche Freigabe behauptet.
- Pages-Deployment e9317ee2 erfolgreich auf hodlware.de, Produktionskonfiguration nach Deployment geprüft: COMMUNICATIONS_ENABLED, MAIL_WORKER_READY, FORMS_ENABLED und ORDER_EMAILS_ENABLED=true. SITE_URL und Stripe-Preis unverändert, keine Secrets ersetzt.
- Finaler Build und Functions-Kompilierung erfolgreich. Unveränderte 62 Tests zuvor erfolgreich; keine unnötige Wiederholung der Suite.
- Start-/Produkt-/Kontakt-/Rechtsseiten HTTP 200, keine geprüften internen Hinweise oder entfernten unbelegten Produktwerte. Form-Context ready=true. Live-Checkout-Session erfolgreich angelegt, Stripe-Hosted-URL bestätigt; keine Zahlung ausgeführt.
- Echte Production-Formularprüfung: Kontakt und Widerruf jeweils zweimal mit derselben Anfrage-ID übermittelt. Genau drei Mailjobs, alle sent bei attempts=1; keine Dubletten. Empfänger steffenreizner@web.de, klar gekennzeichnete technische Tests. Gesamte Outbox neun sent, kein Rückstau.
- Mail-Worker weiterhin auf Version bae0a63c-3331-4e26-903d-dbc4acd27478 aktiv; zuvor geprüfter Minutentakt/Retry unverändert. Fünf vorherige Testmails durch Betreiber als angekommen bestätigt; drei neue Provider-Übergaben nach Deployment bestätigt.
- Stripe-Live-Key-Berechtigungen PaymentIntents/PaymentMethods im Dashboard bestätigt. Automatische Kunden- und Betreiberbestellmails aktiviert. Ein vollständiger neuer Zahlungserfolg als realer End-to-End-Trigger bleibt ungetestet und bedarf eines späteren kontrollierten, separat autorisierten Vorgangs.
- Die oben beschriebenen lokalen Vorbereitungs-/Freigabesperren sind durch diesen finalen Deployment-Auftrag überholt. Manuell bleiben Telefon/Wirtschafts-ID, Produktkennung/Herstellerunterlagen/Sicherheit/Risikobewertung, Anbieter-/WEB.DE-Vertragsprüfung und Lösch-/Betriebsprozesse.

HODLWARE technisch live: JA.
Automatische Bestellbestätigung aktiviert: JA.
Kritischer technischer Blocker: NEIN.

## Quellen (abgerufen 11.10.2026)
- § 356a BGB: https://www.gesetze-im-internet.de/bgb/__356a.html
- EGBGB Musterwiderruf: https://www.gesetze-im-internet.edge.juris.de/bgbeg/art_253anlage_1.html
- Art. 246a § 1 EGBGB: https://www.gesetze-im-internet.juris.de/bgbeg/art_246a__1.html
- § 312f BGB: https://www.gesetze-im-internet.de/bgb/__312f.html
- § 5 DDG: https://www.gesetze-im-internet.juris.de/ddg/__5.html
- § 25 TDDDG: https://www.gesetze-im-internet.juris.de/ttdsg/__25.html
- GPSR Art. 9, 13, 19: https://eur-lex.europa.eu/eli/reg/2023/988/oj?locale=de (konsolidierte Fassung prüfen)
- Resend Versand: https://resend.com/docs/api-reference/emails/send-email
- Resend Idempotenz: https://resend.com/changelog/idempotency-keys
- Resend Preise: https://resend.com/pricing
- Cloudflare Datenschutz: https://www.cloudflare.com/privacypolicy/
- D1-Datenstandort: https://developers.cloudflare.com/d1/configuration/data-location/
- Stripe: https://stripe.com/de/privacy

- Resend Anbieter: https://resend.com/legal/privacy-policy
- Resend Datenschutzvereinbarung: https://resend.com/legal/dpa
- WEB.DE Anbieter: https://web.de/impressum/
- WEB.DE Datenschutz: https://agb-server.web.de/datenschutz

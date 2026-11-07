# Launch der 4-Digit Recovery Plate im November 2026

## Vorschau

Nach `npm run build` startet `node scripts/preview-launch.mjs` die lokale Vorschau auf http://127.0.0.1:8795/. Sie simuliert den 07.11.2026 um 00:00 Uhr in Berlin mit Testbeständen. Der Server bindet nur an Loopback. Die Vorschau verwendet die Shop- und Feed-Renderer, nimmt ausschließlich GET-Anfragen an und kann keine Zahlung oder Bestandsänderung auslösen.

- Startseite: http://127.0.0.1:8795/#shop
- 4-Digit-Produkt: http://127.0.0.1:8795/steel-seed-phrase-recovery-plate
- 8-Digit-Produkt: http://127.0.0.1:8795/steel-seed-phrase-recovery
- Feed: http://127.0.0.1:8795/google-merchant-feed.xml

## Preis und Preiswerbung

Die Git-Historie führt die 4-Digit-Platte ab Commit `50126e1` mit 79,00 € im Katalog. Commit `c22aa70` schaltete den Verkauf frei. Cloudflare meldet für dessen produktives Deployment am 29.10.2026 um **22:28:40 Uhr Europe/Berlin** Erfolg. Die Änderungshistorie von Katalog und Stripe-Konfiguration zeigt seitdem keinen anderen regulären Preis. Die vorige lesende Stripe-Prüfung fand für das Produkt einen einmaligen LIVE-Preis von 79,00 € und keine Promotion Codes. Die lesende D1-Abfrage bis 07.11.2026 ergab eine bezahlte 4-Digit-Position am 31.10.2026 mit 79,00 € pro Stück. Die zugehörige Bestellbestätigung weist 0,00 € Rabatt aus.

§ 11 PAngV bezieht sich auf den niedrigsten tatsächlich gegenüber Verbrauchern angewandten Gesamtpreis in den 30 Tagen vor Beginn. Für diesen Launch ist der Prüfzeitraum **die 30 Tage vor der tatsächlichen Aktivierung am 07.11.2026 (Beginn am 08.10. zur entsprechenden Uhrzeit)**. Der Vorbereitungsstand vom 07.11. liefert noch keinen Abschlussnachweis. Es fehlen die vollständige Dokumentation etwaiger öffentlich verfügbarer Gutscheine oder anderer Preiswege ab Verkaufsstart und der Nachweis bis zum tatsächlichen Aktivierungszeitpunkt. Auch die kurze Angebotsdauer seit 29.10. und der Wortlaut der Werbung sind rechtlich zu prüfen. Ohne Freigabe zeigt der Shop nur den aktuellen Preis, ohne Streichpreis oder Rabattankündigung. Ein einzelner Preis bzw. eine einzelne Bestellung ersetzt diese Prüfung nicht. Quelle: https://www.gesetze-im-internet.de/pangv_2022/__11.html

`PLATE4_LAUNCH_COMPARISON_APPROVED=false` ist in Preview- und Produktionskonfiguration der Standard. Erst nach dokumentierter Prüfung und Freigabe blendet `true` innerhalb der Aktion 79,00 € durchgestrichen ein. Die lokale Designvariante mit fiktiver Freigabe läuft über `node scripts/preview-launch.mjs --comparison` unter http://127.0.0.1:8796/.

## Preisberechnung und Bestellabwicklung

- Standardpreis 79,00 €. Mit expliziter Freigabe ab dem tatsächlichen Aktivierungszeitpunkt am 07.11.2026 bis 01.12.2026 00:00 Uhr exklusiv Europe/Berlin 59,90 €. Paketversand 6,19 €. Eine Platte kostet mit Versand 66,09 €.
- Checkout prüft Betrag, Währung, Modus, Einmaligkeit und Aktivstatus des zugeordneten Stripe-Preises vor der Reservierung. Ein veralteter Warenkorb erhält HTTP 409 und muss mit aktualisiertem Preis erneut bestätigt werden. Aktionskörbe unterbinden Gutscheincodes vollständig, auch gemischte Körbe mit Stickern.
- Bestehende Stripe-Sessions behalten den beim Erstellen bestätigten Preis für ihre reguläre Gültigkeit. Status, gespeicherte Bestellpositionen und E-Mails verwenden den versionierten Kaufpreis, auch bei später eintreffenden Webhooks. Die Stripe-Rechnung bleibt aktiviert und bezieht ihre Positionen aus der Session.
- `SEEDPLATE_SALES_PAUSED` sperrt neue 8-Digit-Käufe einschließlich Mischkörben und kennzeichnet das Produkt als ausverkauft. Die Detailseite bleibt erreichbar. Die Pause endet erst durch eine bewusste Freigabe. Die Datenbank erhält keine Migration.

## Merchant Center

Die gesperrte 8-Digit-Platte wird als `out_of_stock` ausgegeben. Ohne Vergleichspreisfreigabe schreibt der Feed während der Aktion 59,90 € in `g:price`. Mit Vergleichspreisfreigabe liefert er während der Aktion `price=79.00 EUR`, `sale_price=59.90 EUR` und `sale_price_effective_date=2026-11-07T00:00+0100/2026-12-01T00:00+0100`, passend zum sichtbaren Vergleich auf der Landingpage. Vor einer etwaigen Vergleichspreisfreigabe den Feed-Beginn auf den dokumentierten tatsächlichen Aktivierungszeitpunkt abstimmen. Außerhalb des Aktionsfensters liefert der Feed regulär 79,00 € ohne Aktionsattribute.

Der Feed selbst wechselt ohne Cache genau an den vorgesehenen Grenzen. Google speichert eingelesene Preise bis zum nächsten Abruf. Abruf und Verarbeitungsstatus an beiden Grenzen kontrollieren. Wenn zeitgleiche Aktualisierung ohne bestätigtes Sale-Markup nicht sichergestellt werden kann, das betroffene 4-Digit-Angebot für die Übergänge ausblenden und erst nach geprüftem Import wieder anzeigen. Quellen: https://support.google.com/merchants/answer/6324471 und https://support.google.com/merchants/answer/6324460

## Vor einer produktiven Freigabe

1. Preiswerbung, Preishistorie und Umgang mit vor dem Stichtag ausgestellten Sessions freigeben. Keine Werbeaussage auf Basis von 79,90 € übernehmen.
2. 59,90 EUR als separaten einmaligen LIVE-Preis für dasselbe Stripe-Produkt anlegen und als `STRIPE_PRICE_ID_PLATE4_LAUNCH` hinterlegen. Den vorhandenen 79,00-EUR-Preis für die Rückkehr beibehalten.
3. Im Stripe-Testmodus eine echte Test-Checkout-Session mit Testpreis prüfen. Betrag, Rechnung und E-Mail prüfen. Der verbundene Stripe-Zugang zeigt ausschließlich das LIVE-Konto. Das Dashboard verlangt eine Anmeldung. Die automatische Prüfung hat die Bereitstellung einer neuen Sandbox mit neuen Zugangsdaten abgelehnt. Ohne vorhandenen Testzugang ist der Stripe-Aufruf lokal simuliert und die Bestellmail gegen eine temporäre SQLite-Datenbank geprüft.
4. Den freigegebenen Commit veröffentlichen und `PLATE4_LAUNCH_APPROVED=true` sowie `SEEDPLATE_SALES_PAUSED=true` bewusst konfigurieren. Aktionsfreigabe, Vergleichspreisfreigabe und Verkaufspause stehen im Branch standardmäßig auf false.
5. Vor und an beiden Zeitgrenzen Seite, Warenkorb und Feed prüfen. Google-Abruf und Verarbeitungsstatus kontrollieren.
6. Bei Problemen den jeweiligen Schalter deaktivieren. Den neuen Webhook-Verifizierer auf der veröffentlichten Version behalten, solange Aktions-Sessions oder deren Webhooks noch verarbeitet werden können. Die 8-Digit-Pause erst nach bewusster Bestands- und Verkaufsfreigabe zurücknehmen.

# Launch der 4-Digit Recovery Plate im November 2026

## Vorschau

Nach `npm run build` startet `node scripts/preview-launch.mjs` die lokale Vorschau auf http://127.0.0.1:8795/. Sie simuliert den 16.11.2026 um 00:00 Uhr in Berlin mit Testbeständen. Der Server bindet nur an Loopback. Die Vorschau verwendet die Shop- und Feed-Renderer, nimmt ausschließlich GET-Anfragen an und kann keine Zahlung oder Bestandsänderung auslösen.

- Startseite: http://127.0.0.1:8795/#shop
- 4-Digit-Produkt: http://127.0.0.1:8795/steel-seed-phrase-recovery-plate
- 8-Digit-Produkt: http://127.0.0.1:8795/steel-seed-phrase-recovery
- Feed: http://127.0.0.1:8795/google-merchant-feed.xml

## Preis und Preiswerbung

Der bisherige Preis ist laut zentralem Shopkatalog und aktiver, einmaliger LIVE-Stripe-Preis-ID `price_1UVdhGIPPGFjbWPMAO5IFnFA` **79,00 €**. Stripe zeigte für das zugehörige Produkt ausschließlich diesen Preis. Die lesende Abfrage der Promotion Codes ergab keine Einträge. Das ist keine vollständige 30-Tage-Preishistorie.

§ 11 PAngV verlangt bei Bekanntgabe einer Preisermäßigung den niedrigsten Gesamtpreis, der in den 30 Tagen vor der Ermäßigung gegenüber Verbrauchern angewandt wurde. 79,90 €, 20,00 € Ersparnis und 25 % sind daher für diesen Launch nicht belegt. Der Entwurf zeigt ausschließlich **59,90 €** mit dem zeitlichen Hinweis zum Einführungspreis. Vor Veröffentlichung den Wortlaut „Launch-Angebot“ und „Einführungspreis bis 30.11.2026“ und die Preishistorie für den 17.10.–15.11.2026 abschließend rechtlich prüfen. Falls der Wortlaut als Bekanntgabe einer Preisermäßigung gilt, den zutreffenden historischen Preis mit zulässiger Kennzeichnung ergänzen oder eine rechtlich freigegebene neutrale Darstellung verwenden. Quelle: https://www.gesetze-im-internet.de/pangv_2022/__11.html

## Preisberechnung und Bestellabwicklung

- Standardpreis 79,00 €. Mit expliziter Freigabe ab 16.11.2026 00:00 Uhr bis 01.12.2026 00:00 Uhr exklusiv Europe/Berlin 59,90 €. Paketversand 6,19 €. Eine Platte kostet mit Versand 66,09 €.
- Checkout prüft Betrag, Währung, Modus, Einmaligkeit und Aktivstatus des zugeordneten Stripe-Preises vor der Reservierung. Ein veralteter Warenkorb erhält HTTP 409 und muss mit aktualisiertem Preis erneut bestätigt werden. Aktionskörbe unterbinden Gutscheincodes vollständig, auch gemischte Körbe mit Stickern.
- Bestehende Stripe-Sessions behalten den beim Erstellen bestätigten Preis für ihre reguläre Gültigkeit. Status, gespeicherte Bestellpositionen und E-Mails verwenden den versionierten Kaufpreis, auch bei später eintreffenden Webhooks. Die Stripe-Rechnung bleibt aktiviert und bezieht ihre Positionen aus der Session.
- `SEEDPLATE_SALES_PAUSED` sperrt neue 8-Digit-Käufe einschließlich Mischkörben und kennzeichnet das Produkt als ausverkauft. Die Detailseite bleibt erreichbar. Die Pause endet erst durch eine bewusste Freigabe. Die Datenbank erhält keine Migration.

## Merchant Center

Der Entwurf schreibt den aktuellen tatsächlichen Preis in `g:price` und bei gesperrter 8-Digit-Platte `out_of_stock`. Google erlaubt den aktuellen Aktionspreis in `price`, wenn `sale_price` nicht verwendet wird. Für `sale_price` muss `price` den regulären Preis ausweisen und die Landingpage beide Preise zeigen. Solange die Vergleichswerbung unbelegt ist, entfallen `sale_price` und `sale_price_effective_date` gemeinsam. Bei späterer Freigabe eines belegten Vergleichspreises wäre das passende Berliner ISO-Zeitfenster `2026-11-16T00:00+0100/2026-12-01T00:00+0100`; Feed, Seite und Checkout müssten dann zusammen geprüft werden.

Der Feed selbst wechselt ohne Cache genau an den vorgesehenen Grenzen. Google speichert eingelesene Preise bis zum nächsten Abruf. Abruf und Verarbeitungsstatus an beiden Grenzen kontrollieren. Wenn zeitgleiche Aktualisierung ohne bestätigtes Sale-Markup nicht sichergestellt werden kann, das betroffene 4-Digit-Angebot für die Übergänge ausblenden und erst nach geprüftem Import wieder anzeigen. Quellen: https://support.google.com/merchants/answer/6324471 und https://support.google.com/merchants/answer/6324460

## Vor einer produktiven Freigabe

1. Preiswerbung, Preishistorie und Umgang mit vor dem Stichtag ausgestellten Sessions freigeben. Keine Werbeaussage auf Basis von 79,90 € übernehmen.
2. 59,90 EUR als separaten einmaligen LIVE-Preis für dasselbe Stripe-Produkt anlegen und als `STRIPE_PRICE_ID_PLATE4_LAUNCH` hinterlegen. Den vorhandenen 79,00-EUR-Preis für die Rückkehr beibehalten.
3. Im Stripe-Testmodus eine echte Test-Checkout-Session mit Testpreis prüfen. Betrag, Rechnung und E-Mail prüfen. Im Entwurf ist der Stripe-Aufruf lokal simuliert und die Bestellmail gegen eine temporäre SQLite-Datenbank geprüft.
4. Den freigegebenen Commit veröffentlichen und `PLATE4_LAUNCH_APPROVED=true` sowie `SEEDPLATE_SALES_PAUSED=true` bewusst konfigurieren. Beide Schalter stehen im Branch standardmäßig auf false.
5. Vor und an beiden Zeitgrenzen Seite, Warenkorb und Feed prüfen. Google-Abruf und Verarbeitungsstatus kontrollieren.
6. Bei Problemen den jeweiligen Schalter deaktivieren. Den neuen Webhook-Verifizierer auf der veröffentlichten Version behalten, solange Aktions-Sessions oder deren Webhooks noch verarbeitet werden können. Die 8-Digit-Pause erst nach bewusster Bestands- und Verkaufsfreigabe zurücknehmen.

# HODLWARE – Google-Merchant-Center-Feed: vollständiger Vorbereitungsbericht

Stand: 01.11.2026. Branch **feature/google-merchant-feed**. Ausgangspunkt: **a46fa06df8eacedb80a590afd5ef1b9d0167a77b**. Der neue lokale Commit wird in der Abschlussantwort angegeben; dieser Bericht ist Bestandteil des Commits.

**Freigabestatus: NICHT VERÖFFENTLICHT. Technische Implementierung vorbereitet und getestet; produktive Aktivierung wegen fehlender automatisch gepflegter 8-Digit-Bestandsquelle weiterhin blockiert. Merchant-Center-Versandprüfung und ausdrückliche Veröffentlichungsfreigabe ebenfalls erforderlich.**

Repositorywurzel: `C:/Users/Home One/Desktop/TinyMotchi/hodlware-accessories/`. Pfade unten relativ dazu.

## 1. Anzahl und Namen der Angebote

Sechs Feed-Angebote, keine Platzhalterprodukte:

| Stabile ID | Produkt / Paket | Preis | Landingpage |
|---|---|---:|---|
| seedplate | HODLWARE Seed Phrase Backup aus Edelstahl – 8-Digit | 79,00 EUR | /steel-seed-phrase-recovery |
| recoveryplate4 | HODLWARE Recovery Plate – 4-Digit BIP39 | 79,00 EUR | /steel-seed-phrase-recovery-plate |
| void-1 | HODLWARE VOID-Manipulationssticker · 1 Stück | 0,99 EUR | /zubehoer?paket=1 |
| void-5 | HODLWARE VOID-Manipulationssticker · 5 Stück | 3,49 EUR | /zubehoer?paket=5 |
| void-10 | HODLWARE VOID-Manipulationssticker · 10 Stück | 5,99 EUR | /zubehoer?paket=10 |
| void-25 | HODLWARE VOID-Manipulationssticker · 25 Stück | 11,99 EUR | /zubehoer?paket=25 |

Paketpreis gilt für das gesamte Paket, keine Multiplikation mit der physischen Stickerzahl. Die unterschiedlichen Paket-URLs wählen die angebotene Menge bereits voraus; alle sechs Preise direkt auf den vorhandenen öffentlichen Landingpages geprüft.

Die vom Geschäftsführer im Auftrag ergänzten Momentaufnahmen sind **vier physische 8-Digit-Plates und 24 4-Digit-Plates**. Diese Bestände wurden nicht in Datenbanken geschrieben oder zurückgesetzt. Insbesondere ist eine bestehende Inventarbasis nicht automatisch identisch mit verfügbarer Menge nach gehaltenen/bezahlten Reservierungen.

## 2. XML-Struktur und Attribute

Geplante öffentliche URL: **https://hodlware.de/google-merchant-feed.xml**.

RSS 2.0 mit `xmlns:g="http://base.google.com/ns/1.0"`, XML-Deklaration UTF-8 und Channel-Sprache de-DE. Pro Artikel:

- id, deutscher title und description;
- absolute HTTPS-link und image_link, weitere Originalansichten als additional_image_link;
- price mit zwei Dezimalstellen und EUR;
- availability nur in_stock/out_of_stock, niemals öffentliche Lagerzahlen;
- condition new, brand HODLWARE;
- eigene sachliche Kategorie über product_type;
- geprüfter identifier_exists-Wert;
- für selbst zusammengestellte 5er-/10er-/25er-Pakete multipack 5/10/25;
- shipping_label sowie shipping mit country DE, Dienst und korrektem Einzelangebotstarif.

Keine erfundene Google-Taxonomie-ID. Google kann automatisch kategorisieren; `product_type` ist ausdrücklich eine Händlerkategorie, keine vorgetäuschte `google_product_category`. Siehe [Google-Kategorie](https://support.google.com/merchants/answer/6324436?hl=en).

Die unterschiedlichen Stückpakete werden als eigene Angebote mit multipack beschrieben, nicht als erfundene Farb-/Bekleidungsgrößenvarianten. Keine künstliche size- oder item_group_id-Angabe allein aufgrund der Paketmenge. Das entspricht der Abgrenzung von Händler-Multipacks in [Googles Multipack-Regeln](https://support.google.com/merchants/answer/6324488?hl=en). Bei künftig herstellerverpackten Mehrfachpacks muss diese Einordnung neu geprüft werden.

### GTIN / MPN

Der Geschäftsführer hat ausdrücklich bestätigt, dass keine GTIN/EAN oder Hersteller-MPN zugeteilt sind. Deshalb: **identifier_exists=no**, keine erfundenen gtin-/mpn-Felder. Die interne Angebots-ID wird nicht als Hersteller-MPN ausgegeben. Marke HODLWARE bleibt vorhanden.

Der Validator unterstützt echte später bestätigte Kennungen, einschließlich GTIN-Längen-/Prüfzifferprüfung. Bei ungeklärter Kennzeichnung oder falschen Pflichtdaten entsteht kein unvollständiger Feed. Falls doch Herstellerkennungen auftauchen, müssen sie übernommen und der Status angepasst werden. [Offizielle identifier_exists-Regeln](https://support.google.com/merchants/answer/6324478?hl=en).

## 3. Datenquellen und Aktualisierung

- **Preise und Beschreibungen:** unverändert aus `server/catalog.js`, derselben zentralen Quelle wie Checkout und Bestellverarbeitung.
- **Präsentation/Links/Bilder/Identifier-Prüfung:** `server/merchant-products.js`. Nur Feedmetadaten; kein Preis- oder Lagerduplikat. Vorhandene optimierte Originalproduktfotos, keine Bildgenerierung.
- **4-Digit-Bestand:** bestehendes D1 `product_inventory` für recoveryplate4 minus held/paid aus stock_reservations.
- **VOID-Bestand:** ein gemeinsamer physischer D1-Schlüssel void-stickers minus held/paid aus accessory_reservations; jede Paketgröße benötigt 1/5/10/25 verfügbare Einzelsticker. released wird nicht abgezogen. Bestehende Aktivierungs-/Preisfreigabe-/Bestandsschalter werden berücksichtigt.
- **8-Digit:** im gegenwärtigen Checkout keine gepflegte Lagerzeile und keine automatische Reservierungs-/Verkaufsfortschreibung. Vier physische Stück wurden bestätigt, aber eine laufende maschinenlesbare Quelle fehlt. **Kein statischer Wert „4“ und keine dauerhafte InStock-Behauptung implementiert.**

Die Funktion liest die D1-Daten in einer SELECT-Abfrage. Keine INSERT-/UPDATE-/DELETE-Anweisung im Feedcode. Neue Service-Schnittstelle `MERCHANT_SEEDPLATE_AVAILABILITY` ist eine lesende Cloudflare-Servicebindung, die eine tatsächlich maßgebliche 8-Digit-Quelle liefern muss. Es wurde kein neuer Service gebucht oder bereitgestellt.

Vertrag des Adapters: GET auf die interne Adresse /availability/seedplate, JSON mit boolean `available` und ISO-Zeitstempel `observedAt`. Daten dürfen höchstens fünf Minuten alt und nicht unplausibel zukünftig sein; Timeout drei Sekunden. Ein implementierter Adapter muss echte verkaufsbereinigte Verfügbarkeit liefern, nicht lediglich bei jedem Abruf die alte Handzählung neu datieren. Keine Bestandstabelle allein ohne passende Fortschreibung als vermeintliche Lösung verwenden.

Mögliche spätere Lösungen:
1. Vorhandene verlässliche Warenwirtschaft/Bestandsquelle über diese lesende Bindung anbinden.
2. Separat genehmigte vollständige Lagerführung der 8-Digit-Plate im vorhandenen System inklusive Verkäufen/Reservierungen nachrüsten. Das würde den derzeit ausdrücklich ausgeschlossenen Bereich Checkout/Bestandslogik betreffen und wurde **nicht** umgesetzt.

Fehlt eine Quelle, ein Datensatz oder eine bestätigte Produktangabe, oder sind Daten veraltet, antwortet der Endpunkt mit **HTTP 503 + Retry-After**, einem allgemeinen XML-Fehler und ohne interne Bestands-/Fehlerdetails. Nicht mit einem leeren gültigen Feed, nicht mit einer irreführenden InStock-Angabe. Das gesamte Sortiment bleibt zusammenhängend; die 8-Digit-Plate wird nicht heimlich weggelassen.

## 4. Versand – was der Feed abbildet und was im Merchant Center zu prüfen ist

- Plate-Angebot: DE, DHL, **6,19 EUR**.
- Sticker-Angebot bei alleiniger Bestellung: DE, Standardbrief mit Basis-Sendungsverfolgung, **1,10 EUR**.
- Label `plate_parcel` bzw. `sticker_letter` ermöglicht die passende Merchant-Center-Einordnung.
- Checkout bleibt unverändert: mehrere Stickerpakete zusammen einmal 1,10 EUR; mindestens eine Plate insgesamt einmal 6,19 EUR, nicht 7,29 EUR und nicht 1,10 EUR für einen gemischten Warenkorb.

Ein einzelner XML-Artikel kennt den späteren gesamten Warenkorb nicht. Der Feedwert ist ausdrücklich der Tarif für das einzelne Angebot, **keine Implementierung einer vollständigen Google-Warenkorbkomposition**. Produktbezogene Versandwerte können Konto-Regeln überschreiben. Vor Aktivierung müssen die tatsächlich verwendeten Merchant-Center-Dienste und gemischten Einkaufsfälle geprüft werden; eine bloße Versandlabel-Angabe garantiert das nicht.

Deshalb zusätzliche Sperre **MERCHANT_SHIPPING_REVIEWED=true** erst nach dieser Prüfung. Falls Googles konkrete Kontokonfiguration die Regel nicht passend abbildet, Feed nicht freischalten: dann das Versandmodell im Merchant Center bzw. die Feed-Overrides gesondert abstimmen, ohne Shopkosten zu ändern. Keine pauschale, heimliche Erhöhung aller Sticker-Feedtarife auf 6,19 EUR als Workaround vorgenommen. [Google Versand](https://support.google.com/merchants/answer/6324484?hl=en), [Konto-Versandeinstellungen](https://support.google.com/merchants/answer/12577710?hl=en).

## 5. Cloudflare-Integration und Sicherheit

- `functions/google-merchant-feed.xml.js` bindet die ausschließlich lesende Feedfunktion ein.
- `scripts/build.mjs` ergänzt nur `/google-merchant-feed.xml` in `_routes.json`; `/api/*` bleibt erhalten. Keine globale Catch-all-Route und keine statische Feeddatei im Produktionsbuild.
- GET/HEAD bei vollständiger, freigegebener Konfiguration: HTTP 200, `application/xml; charset=utf-8`.
- Kein Login, kein Cookie, keine Kundendaten, keine genaue Lagerzahl. Andere Methoden: HTTP 405.
- `Cache-Control: no-store`, damit bei jedem Abruf aktuelle Quellinformationen gelesen werden; bei Fehlern ebenfalls nicht cachen.
- `MERCHANT_FEED_ENABLED=true` und `MERCHANT_SHIPPING_REVIEWED=true` erforderlich. In `.dev.vars.example` beide bewusst false. Bestehende Produktionsvariablen nicht geändert.
- Öffentliches HTTPS kommt nach späterer Freigabe aus der bestehenden hodlware.de-/Pages-Konfiguration. **Die neue Feed-URL ist derzeit nicht produktiv bereitgestellt**; ihre öffentliche HTTP-200-Antwort kann ohne Deployment nicht bestätigt werden.
- Keine neuen kostenpflichtigen Dienste, kein Cron, kein Stripe-Zugriff und keine Änderung am Zahlungs-/Warenkorb-/Bestellcode. Die bereits bestehenden Cloudflare-Quoten gelten weiterhin.

### Alle 24 Stunden

Der Endpunkt aktualisiert sich **bei jedem Abruf**, nicht nur bei einem Build. Googles Abrufrhythmus ist jedoch eine Einstellung der Datenquelle, keine Wirkung eines XML-Tags. Nach freigegebener Veröffentlichung im Merchant Center einrichten:

- Produkte aus Datei, URL https://hodlware.de/google-merchant-feed.xml, ohne Zugangsdaten;
- Sprache Deutsch, Zielmarkt Deutschland, **Feedlabel DE**;
- geplanter Abruf täglich / alle 24 Stunden, passende Uhrzeit und Zeitzone Europe/Berlin;
- kostenlose Produkteinträge prüfen/aktivieren, keine kostenpflichtige Kampagne anlegen.

Diese Kontokonfiguration wurde nicht vorgenommen. Feedlabel DE ist kein erfundenes XML-Produktattribut. Zwischen zwei Google-Abrufen kann sich Bestand verändern; täglicher Fetch ist keine Echtzeit-Garantie. [Offizieller Abrufplan](https://support.google.com/merchants/answer/14991445?hl=en).

## 6. Testergebnisse

- **142 automatisierte Tests bestanden**, davon neun neue Feedtests; alle bisherigen Checkout-/Bestands-/Webhook-/Mailtests unverändert bestanden.
- Produktions-Build einschließlich Pages-Worker erfolgreich.
- **117 unabhängige XML-/Feedprüfungen bestanden** mit Chromium-DOMParser: Namespaces, sechs eindeutige Produkte, Pflichtattribute, Sonderzeichen-Roundtrip, alle ausverkauft, Bilder, Paketpreise und Versandfelder.
- Reale SQLite-Tests prüfen gehaltene/bezahlte/freigegebene Reservierungen, gemeinsame Stickerquelle, sämtliche Schwellen 0/1/4/5/9/10/24/25/26 und keine Datenänderung durch den Feed.
- Fehlende Daten, ungültige GTIN, fehlende Kennzeichnungsprüfung, ungültige Preise/Bilder/XML-Steuerzeichen, fehlende/veraltete/zukünftige oder falsche 8-Digit-Antwort, deaktivierte Flags und fehlgeschlagene D1-Abfragen getestet.
- **Neun lokale Cloudflare-Pages-Routingprüfungen bestanden**: echter neuer Feedpfad liefert bei gesperrter Konfiguration erwartetes XML-503 statt statischer 404; bestehende Seiten und API-Routing erhalten; unbekannte Seite weiterhin 404; lokales Feed-POST 405.
- Lokaler isolierter Fixture-Feed liefert **HTTP 200**, ohne Anmeldung/Cookie. Das ist ein Testbestand, kein produktiver Lagerfeed.
- **13 vorhandene öffentliche HTTPS-Produkt-/Bildadressen** liefern HTTP 200.
- Alle sechs öffentlichen Produkt-/Paket-Landingpages liefern 200 und zeigen die Feedpreise; die vier Paketparameter wählen die richtige Menge.
- **323 bestehende Shop-Browserprüfungen bestanden**, sechs Viewports: keine Auswirkung auf Galerie, Navigation, Preise, Warenkorb, gemischte Versandberechnung oder den sicher gesperrten lokalen Checkout.
- Keine neue Live-Stripe-Session, Zahlung, Bestellung oder Reservierung ausgelöst.

Belege im selben Ordner: tests.txt, targeted-tests.txt, build.txt, xml-tests.txt, xml-validation.json, pages-routing.json, public-product-links.json, public-landing-prices.json und shop-regression.txt. **example.xml ist ausdrücklich ein lokal generierter Testfeed mit simulierten Verfügbarkeiten und darf nicht als produktiver Feed hochgeladen werden.**

## 7. Merchant-Center-Risiken und Kontoprüfung

- Keine offizielle Merchant-Center-Annahme, Produktfreigabe oder Richtlinienzulassung behauptet. Kein authentifizierter Merchant-Center-Zugriff verwendet.
- Shop stellt körperliche Backupplatten und Manipulationsindikatoren dar, keine Kryptowährungen, Anlagen oder Wiederherstellungsdienstleistungen. Google entscheidet dennoch selbst über Richtlinien und Kategoriezuordnung; die Abgrenzung zu ausgeschlossenen Finanzprodukten bleibt eine Kontoprüfung. [Nicht unterstützte Inhalte](https://support.google.com/merchants/answer/6150006?hl=en).
- Bestehende HTTPS-Landingpages, Kontakt-/Impressums-, Versand- und Widerrufsseiten sind vorhanden. Geschäftsidentität, Website-Verifizierung/-Beanspruchung sowie Rückgabe- und Versandrichtlinien müssen im Merchant Center zur Website passen.
- VOID liegt auf einer Zubehörseite mit direkt vorausgewähltem Paket. Google kann eine stärker produktspezifische Landingpage verlangen, insbesondere bei künftig mehreren Zubehörprodukten.
- Google bestimmt automatische Kategorien und kann Kennzeichnungs-/Bild-/Gruppierungshinweise melden. Keine Bewertung, Zertifizierung, GTIN oder MPN zur Umgehung erfinden.
- Verfügbarkeit der 8-Digit-Plate und die Prüfung der Merchant-Center-Versandkomposition sind echte Aktivierungsvoraussetzungen, keine kosmetischen Hinweise.

## 8. Geänderte Dateien und erforderliche nächste Schritte

Neue Dateien:
- `server/merchant-feed.js`
- `server/merchant-products.js`
- `functions/google-merchant-feed.xml.js`
- `tests/merchant-feed.test.js`
- `scripts/preview-merchant-feed.mjs` (nur lokale Fixtures)
- `scripts/qa-merchant-feed.mjs`
- `artifacts/merchant-feed/` (dieser Bericht, Testbelege, Test-XML)

Geändert:
- `scripts/build.mjs`: genau den Feedpfad in der Workers-Routenliste ergänzt.
- `.dev.vars.example`: standardmäßig deaktivierte neue Feedschalter dokumentiert.

Unverändert: zentrale Produktpreise, Produktseiten, Bilder, Warenkorb, Checkout, Stripe, D1-Schema, operative Bestandslogik, Versandkosten, Bestell- und Mailverarbeitung; keine produktive Konfiguration angefasst.

Vor dem Livegang erforderlich:
1. **Zuverlässige automatisch fortgeschriebene Quelle für die 8-Digit-Verfügbarkeit lösen**, ohne die bestätigten vier Stück als endlosen statischen Bestand auszugeben. Für notwendige Änderungen an Bestands-/Checkoutprozessen gesonderten Auftrag einholen; derzeitige Vorgabe schließt diese Änderungen aus.
2. Merchant-Center-Geschäfts-/Website-/Rückgabeangaben und Versandkonfiguration prüfen, besonders Mischwarenkörbe. Erst danach MERCHANT_SHIPPING_REVIEWED freigeben.
3. Account-Zugang und Datenquelleneinstellungen Deutsch / Deutschland / DE / täglich vorbereiten. Keine Anzeigenkampagne nötig.
4. Ausdrückliche Geschäftsführer-Freigabe zur Veröffentlichung einholen. Aktuellen main-Stand vor Integration erneut abgleichen.
5. Endpunkt mit echter geprüfter Quelle und Flags veröffentlichen; danach öffentliches HTTPS-200, sechs XML-Angebote, Quellverfügbarkeit und Google-Verarbeitung prüfen. Keine echte Zahlung nötig.

**Endergebnis: Vollständige technisch mögliche Implementierung auf separatem Branch, kein Deployment. Noch nicht zur produktiven Aktivierung freigabefähig, solange der 8-Digit-Bestandsblocker und die Merchant-Center-Versandprüfung offen sind.**

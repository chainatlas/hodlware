# HODLWARE – SEO Phase 2: Umsetzung zur Freigabe

Branch: **feature/seo-phase-2**. Ausgangscommit: **b53128bfd81bcd17c01ff6630bcb6bf08ceef10d**.
Status: vollständig lokal vorbereitet und geprüft. **Kein Push, kein Deployment.**
Repositorywurzel: `C:/Users/Home One/Desktop/TinyMotchi/hodlware-accessories/`. Alle folgenden Dateipfade relativ dazu.

## Ergebnis

Die Produktdaten für beide Plates und die vier VOID-Paketgrößen werden aus dem bestehenden autoritativen Katalog erzeugt. Preise, Paketbezug, Bilder und Verkäuferidentität sind konsistent. Verfügbarkeit wird ausschließlich lesend aus dem bereits vorhandenen Shopstatus in das Markup übertragen. Titel/H1 und interne Links unterscheiden die 4-Digit- und 8-Digit-Suchintention deutlicher. Keine Bestands-/Zahlungsänderungen und keine neuen Sicherheitsversprechen.

## 1. Strukturierte Produktdaten

### Beide Recovery Plates

- Product mit bestehendem offiziellen Produktnamen, eindeutiger SKU, URL/@id, Beschreibung, Marke, allen vorhandenen Galeriebildern und Offer.
- Preis jeweils 79.00 EUR, aus `server/catalog.js` gelesen; keine separate SEO-Preisliste.
- Offer: NewCondition, Verkäufer HODLWARE, Versandziel Deutschland, shippingRate 6.19 EUR sowie Link /versand-zahlung. Dieser Tarif gilt auch bei gemischten Warenkörben mit einer Plate.
- Keine statische InStock-Behauptung im Roh-HTML. Die bestehende Shopverfügbarkeit wird nach dem Laden lesend übernommen; kein neuer API-Aufruf, kein Zugriff auf D1, keine Reservierung. 8-Digit folgt der bestehenden nicht lagerverwalteten Produktfreigabe; 4-Digit folgt dem vorhandenen managedStock-Status.
- Keine erfundenen Bewertungen, GTINs, Zertifikate, Materialtests oder Preisgültigkeitsdaten. Lieferzeit 2–4 Werktage nach Zahlung wird nicht in erfundene Handling-/Transitanteile aufgeteilt.

### VOID-Manipulationssticker

- /zubehoer bleibt die bestehende CollectionPage und erhält ein ProductGroup als mainEntity mit vier Product-Varianten. Paketgröße als size, eindeutige SKUs void-1/5/10/25, drei Originalmotive, Abmessungen 5 × 1 cm je Sticker und eindeutige Variantennamen.
- Vier Offers: 0.99 / 3.49 / 5.99 / 11.99 EUR **pro Paket**, unverändert aus dem bestehenden Katalog. Keine Multiplikation des Paketpreises mit der physischen Stickerzahl.
- Direkt aufrufbare UI-Auswahl: /zubehoer?paket=1, ?paket=5, ?paket=10, ?paket=25. Sie wählen das jeweilige vorhandene Mengenpaket voraus. Ungültige Werte fallen auf die bisherige erste Variante zurück. Alle behalten Canonical https://hodlware.de/zubehoer; Sitemap enthält weiterhin nur die Kategorie, keine vervielfachten Query-URLs.
- Verfügbarkeit wird für jede Paketgröße separat aus dem vorhandenen Shopstatus gespiegelt. Unterschiedliche Ergebnisse je Paket sind bei gemeinsamem physischem Restbestand möglich. Markup zeigt keine Bestandszahlen und erzeugt keine getrennten Bestände.
- Sticker-Versand ist bedingt: 1,10 EUR bei reinen Stickerbestellungen, 6,19 EUR mit Plate. Deshalb kein pauschales shippingRate:1.10, das gemischte Bestellungen falsch darstellen würde. Stattdessen destination DE, shippingSettingsLink zur sichtbaren Versandregel und präzise Beschreibung beider Fälle. Die operative Versandlogik bleibt unverändert.

### Umsetzung und Konsistenz

`scripts/seo-data.mjs` erzeugt die Daten sowohl für die HTML-Quellen als auch beim Build für die tatsächliche Ausgabe. `scripts/build.mjs` aktualisiert das Markup aus dem Katalog und kopiert/versioniert den neuen Beobachter `assets/seo-availability.js`. Wiederholter Build erzeugt genau einen Datenblock und einen Beobachter pro Produktseite. Die Startseite bekommt einen einfachen konsistenten Organization-Eintrag für den in Offers referenzierten Verkäufer, ohne erfundene Register-/Adressangaben.

`assets/seo-availability.js` hört nur das vorhandene hwcartchange-Ereignis ab und liest den vorhandenen stockState. Es verändert weder Warenkorb noch Stockstatus, Preis oder Kaufbuttons. Bei unbekanntem Status wird availability weggelassen; nach bestehender fehlgeschlagener Shopabfrage entspricht OutOfStock der vorhandenen gesperrten UI. Keine hart codierten Bestandsmengen.

Grundlage: [Google Merchant Listings](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing), [Google Product Variants](https://developers.google.com/search/docs/appearance/structured-data/product-variants), [Schema.org OfferShippingDetails](https://schema.org/OfferShippingDetails). Varianten müssen echte auswählbare Angebote darstellen. Die Schema.org-Verlinkung auf Versandregeln ist kein Nachweis, dass Google diese komplexe Warenkorbbedingung vollständig auswertet.

## 2. SEO-Verbesserungen je Seite

### Startseite – index.html

- Titel: **Seed Phrase Backup aus Metall kaufen | HODLWARE**
- H1: **Seed Phrase Backup aus Metall – HODLWARE**
- Meta: Seed Phrase offline auf Edelstahl sichern: Entdecke HODLWARE Recovery Plates mit 4 oder 8 Buchstaben pro Wort und finde das passende Backup-Set.
- Ausrichtung: kommerzielle Produktauswahl statt Konkurrenz zur Informationsanleitung „Seed Phrase sicher aufbewahren“.
- Kartenüberschriften eindeutig „Recovery Plate – 8-Digit“ bzw. „Recovery Plate – 4-Digit“; Links direkt ohne .html-Umweg.
- Bestehende allgemeine Versand-FAQ sachlich an bereits geltende Regeln angepasst: Plate 6,19 EUR, reine Stickerbestellung 1,10 EUR. Keine Tarifänderung. Startseite weiterhin nur zwei Plate-Produktkarten, keine Stickerkarte.

### 8-Digit – steel-seed-phrase-recovery.html

- Titel: **Seed Phrase Backup: 8 Buchstaben pro Wort | HODLWARE**
- H1: **Seed Phrase Backup aus Edelstahl – 8 Buchstaben pro Wort**
- Meta: Seed Phrase auf Edelstahl sichern: bis zu 8 Zeichen pro Wort für 12, 18 oder 24 Wörter. Mit Metallbuchstaben, Werkzeug und Tasche.
- Ausrichtung: mehr Zeichen pro Wort, auch 18 Wörter, Lieferumfang mit Tasche.
- Kontextueller Link auf 4-Digit als Alternative, ohne beide Produkte gleichzusetzen. Vorhandene drei Ratgeberlinks bleiben.
- Schutzformulierung sachlicher als physische Dokumentation beschrieben; keine garantierte Feuer-/Wasser-/Zerstörungsresistenz zugesagt. Originalbilder, Geometrie und Phase-1-Optimierungen erhalten.

### 4-Digit – steel-seed-phrase-recovery-plate.html

- Titel: **BIP39 Backup: Recovery Plate mit 4 Buchstaben | HODLWARE**
- H1: **BIP39 Recovery Plate – 4 Buchstaben pro Wort**
- Meta: Recovery Plate aus Edelstahl 304: die ersten 4 Buchstaben für 12 oder 24 Wörter der englischen BIP39-Liste. Mit Metallbuchstaben und Werkzeug.
- Ausrichtung: erste vier Buchstaben der englischen BIP39-Wortliste, 12/24 Wörter, kompaktes Modell. Keine Unterstützung anderer Sprachen oder 18 Wörter erfunden.
- Link auf 8-Digit bei Bedarf an mehr Zeichen/18 Wörtern; Links auf Metall-Anleitung und Aufbewahrungsratgeber.

### Zubehör – zubehoer.html / assets/accessories.js

- Titel: **VOID-Manipulationssticker 5 × 1 cm | HODLWARE Zubehör**
- Meta: Besonders dünne VOID-Sticker in 1er-, 5er-, 10er- und 25er-Paketen. Sichtbares VOID-Muster beim Ablösen – Manipulationsindikator ohne Schutzgarantie.
- H1 bleibt HODLWARE Zubehör, Produkt-H2 bleibt HODLWARE VOID-Manipulationssticker; erweiterbare Kategorie erhalten.
- Kontextueller Link zum Aufbewahrungsratgeber und zurück zur Plate-Auswahl. Kein Zubehör-Upsell auf Plate-Seiten.
- Auswahl über Paket-Queryparameter funktioniert ohne Änderung von Warenkorb-/Checkoutverträgen.

### Aufbewahrungsratgeber – ratgeber/seed-phrase-sicher-aufbewahren.html

- Titel: **Seed Phrase sicher aufbewahren: Orte & Risiken | HODLWARE**
- Meta: Wo bewahrst du deine Seed Phrase auf? Plane Offline-Backups, geeignete Orte und mehrere Kopien und vermeide die Risiken digitaler Sicherungen.
- H1 unverändert. Hauptintention bleibt Information zu Aufbewahrungsorten und Risiken.
- Vorhandene Verweise auf andere Ratgeber/8-Digit erhalten; 4-Digit sachlich als Alternative für passende Wallet-Vorgaben ergänzt.

### Papier/Metall – ratgeber/seed-phrase-papier-oder-metall.html

- Titel: **Seed Phrase: Papier oder Metall? Vergleich | HODLWARE**
- Meta: Papier oder Metall für dein Seed-Phrase-Backup? Vergleiche Haltbarkeit, Aufwand und Zugriffsrisiken und wähle eine passende Offline-Aufbewahrung.
- H1 unverändert, Vergleichsintention beibehalten. Link auf passende 4-Digit-Alternative ergänzt, vorhandene informative Links erhalten.

### Metall-Anleitung – ratgeber/seed-phrase-auf-metall-sichern.html

- Titel: **Seed Phrase auf Metall sichern: Anleitung | HODLWARE**
- Meta: Seed Phrase mit Metallbuchstaben sichern: Übertragung vorbereiten, Wörter einsetzen, Reihenfolge prüfen und das fertige Backup geschützt aufbewahren.
- H1 unverändert. Umsetzung mit Metallbuchstaben bleibt Hauptthema; kein erfundenes Stanzverfahren.
- Link auf 4-Digit-Alternative ergänzt; bestehender 8-Digit-Link bleibt im Anleitungskontext.

In den sieben bearbeiteten HTML-Seiten sind Navigations-/Footerlinks auf direkte kanonische Pfade umgestellt. Produktlinks bleiben kontextuell; keine Footer-Keywordketten, keine neuen Suchwort-Landingpages und kein unbelegter STEELQR-Bezug.

## 3. Qualitätssicherung

- **133 automatisierte Tests bestanden.** Einschließlich aller bisherigen Checkout-, Preis-, Versand-, Reservierungs-, Webhook- und Mailtests sowie neuer SEO-Tests.
- **Produktions-Build erfolgreich.** Keine neue Laufzeitabhängigkeit, keine Änderung an package.json/Lockfile.
- **323 bestehende Playwright-Prüfungen bestanden**, sechs Viewports; Warenkorb, gemischte Bestellungen, Versandbeträge, gesperrter lokaler Checkout, Navigation, Zubehördarstellung und keine Stickerkarten auf Startseite.
- **140 Phase-1-Routing-/Galerieprüfungen bestanden**, lokale Cloudflare-Pages-Laufzeit: echte 404, gültige URLs und .html-Weiterleitungen, historische Ratgeberredirects, alle Galerien/Lightbox, keine abgeschnittenen Bilder, Größenreduktion erhalten.
- **145 neue SEO-Browserprüfungen bestanden**, Desktop 1440/Mobil 390: alle sieben Hauptseiten, Titel/Meta/eine H1, Canonicals, parsebares JSON-LD, vorhandene interne Linkziele, Paket-Direktlinks 1/5/10/25, jeweilige Canonical-Konsolidierung, unterschiedliche verfügbare/ausverkaufte Paketangebote und Übereinstimmung mit dem Kaufbutton.
- Keine Browser-Laufzeitfehler. 14 Vollseiten-Screenshots im Ordner.
- Unit-Prüfung: Preise exakt aus Katalog; alle Bildziele vorhanden; keine falsche pauschale Sticker-Versandrate; keine erfundenen Ratings/Zertifikate; Schemaeinfügung idempotent; Verfügbarkeitsbeobachter ohne Netzwerkzugriff und ohne Preisänderung.
- Canonicals, Sitemap, robots.txt und _redirects inhaltlich unverändert. Query-Varianten werden nicht zusätzlich in Sitemap aufgenommen. 404-Datei und API-Routing aus Phase 1 bleiben erhalten.
- Kein Live-Checkout, keine kostenpflichtige Zahlung, keine produktive Session oder Reservierung angelegt. Lokale Checkoutintegration mit simuliertem Stripe und gesperrter Browserzahlung geprüft.

## 4. Geänderte Dateien

- `index.html`
- `steel-seed-phrase-recovery.html`
- `steel-seed-phrase-recovery-plate.html`
- `zubehoer.html`
- `ratgeber/seed-phrase-sicher-aufbewahren.html`
- `ratgeber/seed-phrase-papier-oder-metall.html`
- `ratgeber/seed-phrase-auf-metall-sichern.html`
- `assets/app.js`: nur Kartenüberschriften und kanonische Produktlinks; keine Warenkorb-/Bestandslogik geändert.
- `assets/accessories.js`: nur vorausgewähltes Paket aus validiertem Queryparameter.
- `assets/seo-availability.js`: neuer ausschließlich lesender Markup-Beobachter.
- `scripts/seo-data.mjs`: neue Katalogprojektion für strukturierte Daten.
- `scripts/build.mjs`: Markup-Erzeugung und versionierte Auslieferung des neuen Beobachters.
- `scripts/qa-seo-phase2.mjs`: neue lokale SEO-Browserprüfung.
- `tests/seo-phase2.test.js`: neue Konsistenz-/Availability-Tests.
- `tests/accessories.test.js`, `tests/product-content.test.js`: frühere Erwartung „keine Offers“ und englische H1 an den freigegebenen neuen SEO-Auftrag angepasst; übrige Produkt-/Sicherheitsprüfungen erhalten.
- `artifacts/seo-phase-2/`: dieser Bericht, Logs, Rohprüfungen und Screenshots.

Unverändert: `server/`, `functions/`, `migrations/`, `operations/`, `wrangler.toml`, `assets/checkout.js`, `assets/checkout-result.js`, Preis-/Bestandskatalog und Produktfotos. Kein produktiver Konfigurationszugriff erforderlich.

## 5. Risiken und bewusste Grenzen

1. **Google-Prüfung ausstehend:** JSON-LD-Syntax, Datenkonsistenz und UI-Verhalten lokal geprüft. Kein automatisierter offizieller Google Rich Results Test und keine Search-Console-URL-Prüfung für diese unveröffentlichte Fassung. Keine Garantie auf Rich Results oder Rankings.
2. **Verfügbarkeit benötigt Rendering:** Managed-Stock-Angebote haben im Roh-HTML absichtlich keine unbestätigte availability. Google muss JavaScript ausführen. Das ist ehrlicher als eine veraltende statische Bestandsbehauptung, kann aber Produktdarstellung verzögern oder einschränken. Keine dynamische Server-/D1-Abfrage allein für SEO eingeführt.
3. **Bedingter Sticker-Versand:** Google kann shippingSettingsLink/Beschreibung unvollständig auswerten und fehlenden numerischen Sticker-Versandtarif als Hinweis melden. Kein falscher Pauschaltarif als Workaround. Für weitergehende Merchant-Integration wäre eine gesonderte Abstimmung nötig.
4. **Kategorie bleibt Kategorie:** Zurzeit nur ein Zubehörprodukt mit vier Paketen. Mit mehreren unterschiedlichen Zubehörprodukten sollte ProductGroup auf eine eigene Produktdetailseite wandern. Aktuell keine neue Produkt-URL und keine Änderung bestehender Canonicals.
5. **Suchintention:** Die Differenzierung ist sachlich begründet; tatsächliche Kannibalisierung ist ohne Query-/URL-Daten aus GSC weiter unbewiesen. Erfolg nach Veröffentlichung anhand mehrwöchiger Daten bewerten.
6. **Unbelegte Angaben vermieden:** Keine erfundenen Bewertungen, Sicherheitstests, Lieferzeitbestandteile oder Zertifikate. Keine Materialstärke für VOID ergänzt.

## 6. Empfehlung und Freigabegrenze

**Technisch zur Abnahme und anschließenden Veröffentlichung geeignet.** Keine kritischen lokalen Fehler gefunden. Vor späterer Veröffentlichung den inzwischen aktuellen main-/Produktionsstand erneut abgleichen; Build und relevante Tests wiederholen. Keine D1-Migration, neuen Stripe-Preise oder Bestandsinitialisierung erforderlich.

Nach ausdrücklicher Freigabe über bestehenden GitHub-/Pages-Prozess veröffentlichen und die öffentlichen Hauptseiten, Schema-Verfügbarkeit, Direktwahl der vier Pakete, Canonicals und Checkout-Bereitschaft prüfen. Danach Rich Results Test und GSC-URL-Prüfung durchführen; Schemawarnungen zu Versand/Verfügbarkeit transparent beurteilen und keine erfundenen Felder ergänzen. Bei kritischem Fehler auf den kompatiblen SEO-Phase-1-Stand b53128b zurückrollen, ohne Datenbank oder Zahlungen anzufassen.

**Aktuell keine Veröffentlichung, kein Push und keine produktive Änderung. Die Umsetzung wartet auf ausdrückliche Freigabe.**

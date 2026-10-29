# Zweites Produkt – lokale Integration / Freigabestand

Stand: 2026-10-27. Branch: `feature/recovery-plate-4-digits`.
Keine Veröffentlichung, keine Produktionsmigration, keine echten Zahlungen oder E-Mails. Bestehende Live-Konfiguration nicht gelesen oder verändert.

## Ergebnis

- Bisheriges Produkt `seedplate`: unverändert 79,00 EUR, acht Bilder, eigene Detailseite.
- Neuer Artikel `recoveryplate4`: HODLWARE Steel Seed Phrase Recovery Plate, 79,90 EUR. 24 verkaufsfähige Exemplare vom Betreiber bestätigt.
- Eigene Seite: `/steel-seed-phrase-recovery-plate`; lokale Vorschau: http://127.0.0.1:8791/steel-seed-phrase-recovery-plate.html
- Galerie: Originalaufnahme 1 (geschlossen), 3 (geöffnet), 2 (Einzelteile), 4 (Zubehör). Vier große WebP-Dateien plus vier 640-px- und vier Thumbnail-Versionen. Keine erfundenen Aufnahmen, keine geometrischen Bildänderungen. Originaldateien unangetastet.
- Beide Artikel separat und gemischt bestellbar nach Aktivierung; Preise werden ausschließlich serverseitig bestimmt und gegen Stripe geprüft. DHL einmalig 6,19 EUR, Deutschland, §19-Konfiguration unverändert.
- Neue Sessions speichern Artikel-IDs/Mengen in serverseitigen Stripe-Metadaten; verifizierte Stripe-Positionen, Beträge und Modi werden abgeglichen. Statusantwort, Bestellpositionen und E-Mails unterscheiden beide Produkte. Ältere Sessions mit quantity-Metadaten bleiben verarbeitbar.
- Keine neue Bibliothek. Vorhandene Functions, D1 und Mail-Outbox werden verwendet.

## Vor der Produktionsfreigabe

1. Die vorhandenen, bereits vor diesem Auftrag uncommitteten Änderungen müssen einem geprüften Release zugeordnet werden. Daher noch kein Commit/Push/PR erstellt; der separate lokale Branch ist vorhanden. Die aufgabenbezogenen Ausgangsdateien liegen zur Abgrenzung lokal in `.cache/product2-baseline`.
2. Nach Freigabe die additive Migration `0003_product_inventory.sql` auf der vorgesehenen D1-Datenbank ausführen (0001/0002 vorausgesetzt). Keine Löschung oder Änderung bestehender Bestellungen. Migration legt Artikelpositionen und Bestand/Reservierungen an und initialisiert nur den neuen Artikel mit 24. Wiederholung setzt den Bestand nicht zurück.
3. Eigenes Stripe-Produkt mit dem neuen Artikelnamen und aktivem einmaligem EUR-Preis 7990 Cent im passenden Konto/Modus anlegen oder verifizieren. Die echte Price-ID als `STRIPE_PRICE_ID_PLATE4` konfigurieren. Bestehende `STRIPE_PRICE_ID` und Keys nicht ersetzen. Keine produktive ID erfunden.
4. Den bestehenden Webhook um `checkout.session.expired` ergänzen. `checkout.session.completed`, `checkout.session.async_payment_succeeded` und `checkout.session.async_payment_failed` müssen erhalten bleiben. Keine Webhook-Konfiguration in diesem Auftrag verändert.
5. Zugriff des bestehenden eingeschränkten Stripe-Keys auf beide Preise, Checkout Sessions einschließlich expandierter Positionen sowie die bereits verwendeten PaymentIntents/PaymentMethods bestätigen. Dies wurde nicht gegen das Live-Konto getestet.
6. Nach erfolgreicher Migration und geprüftem Deployment `PLATE4_ENABLED=true` setzen. Fehlt der Schalter/Preis oder die Bestandsstruktur, bleibt der neue Artikel gesperrt. Keine der neuen Variablen wurde produktiv gesetzt. Die Migration muss vor dem Code-Deployment erfolgen: neue Bestellpositionen werden auch für neue Sessions des bisherigen Artikels gespeichert.
7. Ein echter Hosted-Checkout-Durchlauf mit der neuen Price-ID wurde nicht durchgeführt. Vor Freigabe möglichst in einer separaten Testumgebung mit eigenen Testpreisen prüfen; keine Live-Konfiguration auf Test umstellen.

## Bestand und Betriebsgrenzen

Reservierungen werden vor Session-Erstellung atomar gegen den verfügbaren Bestand geprüft. Dieselbe Anfrage nutzt dieselbe Reservierung und Stripe-Idempotenz. Sessions mit neuem Artikel laufen nach einer Stunde ab. Erfolgreiche Zahlungen verbrauchen die reservierte Menge genau einmal. Bestätigte Ablauf-/Fehlerereignisse geben sie frei; ein Klick auf Abbrechen allein tut das nicht. Verzögerte Zahlungsarten halten Ware bis zum endgültigen Ergebnis reserviert. Bezahlte Bestellungen bleiben bei verspäteten Ereignissen bezahlt.

Bei unklarer Stripe-Antwort bleibt die Reservierung bewusst erhalten. Wiederholung derselben Anfrage innerhalb 30 Minuten ist möglich. Verwaiste Reservierungen ohne zugeordnete Session müssen anhand Stripe geprüft werden, bevor sie manuell freigegeben werden; sie werden nicht unsicher per Zeitablauf gelöscht. Widersprüchliche Ereignisse (bezahlt nach bereits freigegeben) verlangen manuelle Prüfung und erzeugen eine wiederholbare Fehlerantwort statt Überverkauf. Wiederholte Checkout-Starts können Bestand vorübergehend reservieren; Bestands-/Fehlerüberwachung ist vor Aktivierung einzuplanen. Rückerstattungen/Retouren und Nachlieferungen erhöhen Bestand nicht automatisch. Bestehender Artikel erhält keine erfundene Bestandszahl.

## Prüfungen

- `pnpm test`: 77/77 bestanden, Netzwerk für den finalen Testlauf gesperrt; Stripe und Resend ausschließlich simuliert, SQLite im Arbeitsspeicher.
- Bestehende 62 Tests weiterhin erfolgreich; 15 neue Fälle für zwei Artikel, Preismanipulation, Modus-/Positionsprüfung, Rabatte, Versand, Bestand, gleichzeitige Reservierungen, Wiederholungen, Ablauf/Fehler, atomare Rollbacks, Kunden-/Betreibermails und verifizierte Statusantwort.
- `pnpm build`: erfolgreich.
- Browser lokal: zwei Produktkarten, eigene Links, Galerie und Vergrößerung, Hinzufügen/Entfernen pro Artikel, Mengensteuerung, gemischte Summen, Zahlungssperre der Vorschau.
- Beispiel: 1 alt + 1 neu = 165,09 EUR; 1 alt + 2 neu = 244,99 EUR; nach Entfernen des neuen Artikels 85,19 EUR.
- Mobile bei 390 px: einspaltig, vollständige Produktaufnahme, vier geladene Thumbnails, kein horizontaler Überlauf. Desktop geprüft.
- Die lokale Vorschau verwendet ausschließlich den isolierten 24-Stück-Testbestand. Zahlungen und Mailversand dort technisch deaktiviert. Sie ist kein Stripe-End-to-End-Test.

## Geänderte Dateien dieses Auftrags

- `assets/products.js`
- `assets/app.js`
- `assets/checkout.js`
- `assets/checkout-result.js`
- `assets/style.css`
- `server/checkout.js`
- `server/order-mail.js`
- `scripts/build.mjs`
- `sitemap.xml`

## Neue Dateien dieses Auftrags

- `steel-seed-phrase-recovery-plate.html`
- `server/catalog.js`
- `server/inventory.js`
- `migrations/0003_product_inventory.sql`
- `tests/product2.test.js`
- `PRODUCT2-SETUP.md`
- `assets/images/recovery-plate-4-digits-01.webp`
- `assets/images/recovery-plate-4-digits-01-640.webp`
- `assets/images/recovery-plate-4-digits-01-thumb.webp`
- `assets/images/recovery-plate-4-digits-02.webp`
- `assets/images/recovery-plate-4-digits-02-640.webp`
- `assets/images/recovery-plate-4-digits-02-thumb.webp`
- `assets/images/recovery-plate-4-digits-03.webp`
- `assets/images/recovery-plate-4-digits-03-640.webp`
- `assets/images/recovery-plate-4-digits-03-thumb.webp`
- `assets/images/recovery-plate-4-digits-04.webp`
- `assets/images/recovery-plate-4-digits-04-640.webp`
- `assets/images/recovery-plate-4-digits-04-thumb.webp`

Zusätzlich ausschließlich lokal/ignoriert: erzeugter `dist`-Build, Dateisicherung, Vorschau-Server und Vorschau-Logs unter `.cache`. Keine Änderungen an Rechtstexten, Mail-Worker, produktiven Bindings oder vorhandenen Secrets.

Bereit zur lokalen Abnahme: JA. Für sofortige produktive Aktivierung: NEIN, bis Konfiguration, Migration, Release-Abgrenzung und Freigabe erfolgt sind.

Abschlussprüfung: Keine schlüsseltypischen Werte in den geänderten Laufzeit-/Frontend-Dateien gefunden. Alle zwölf neuen Bilddateien im Build vorhanden; zusammen ca. 456 KB.

## Produktkorrektur – 28.10.2026 (nur lokal)

- Ursache der Zeichenfehler: Der Katalog wurde zuvor ohne explizite UTF-8-Lesecodierung verarbeitet und als Windows-1252 fehlinterpretiert. Katalog vollständig korrigiert; `.editorconfig` setzt UTF-8. `scripts/check-product-encoding.mjs` prüft HTML, Frontend-JavaScript, Server-/Mail-Templates, API- und Build-Skripte auf ungültiges UTF-8 und typische Doppelcodierung. Der Build bricht vor dem Ersetzen von `dist` ab, wenn die Prüfung fehlschlägt.
- Öffentliche Verfügbarkeit enthält ausschließlich `available`; keine Lagerzahl, auch nicht in `/api/checkout-context`. UI zeigt „Verfügbar“ oder „Derzeit nicht verfügbar“. Warenkorb-Mengen verwenden nur das allgemeine 99-Limit; die unveränderte serverseitige Reservierung schützt den tatsächlichen Bestand. Interner Anfangsbestand weiterhin 24.
- 4-Digit und 8-Digit sind auf Karten, Detailseiten, Warenkorb und in den katalogbasierten Bestellmails eindeutig benannt. Preise unverändert 79,90 / 79,00 EUR, DHL einmalig 6,19 EUR. Keine Produkt-IDs oder Stripe-Zuordnungen verändert.
- Kompakter Vergleich auf Shop und beiden Detailseiten, gegenseitige Links, angepasste Titel/Descriptions/Open Graph/Produktdaten. Sitemap enthält weiterhin beide kanonischen Produkt-URLs.
- 4-Digit-Beschreibung deutlich erweitert: Funktionsweise, englische BIP39-Wortliste, Einrichtung, technische Daten, Lieferumfang, Sicherheit und sechs FAQs. Keine erfundenen Zertifikate oder Resistenzgarantien.
- Galerie: gleiche 3:2-Anzeigeflächen und Thumbnails, vollständig sichtbare Fotos mit `contain`, transparenter statt heller Auffüllung. Die vom Layout erzeugten hellen Balken sind entfernt; Vergrößerung und responsive WebP bleiben erhalten. Desktop-Galerie bei allen vier Bildern stabil 552 × 368 px.
- Bewusste Einschränkung: Die tatsächlichen Hintergründe/Weißabgleiche der vier Originalaufnahmen unterscheiden sich. Eine verlustfreie Maskierung ist bei ähnlichen Stahl-/Hintergrundfarben nicht zuverlässig gewährleistet. Deshalb keine Bildretusche, keine generierten Details und keine Veränderung der vorhandenen WebP-Dateien. Für exakt einheitliche Studiohintergründe sind freigestellte Originale bzw. passende Neuaufnahmen erforderlich.
- Qualitätssicherung: 82/82 Tests erfolgreich, darunter fünf neue Regressionsprüfungen für Codierung, Varianten/Metadaten, Textumfang, öffentliche Lageranzeige und API-Datensparsamkeit. Vollsuite mit blockierten externen Netzwerkverbindungen. `pnpm build` erfolgreich; alle zwölf WebP-Dateien identisch im Build vorhanden. Desktop 1440 px und Mobile 390 px geprüft; kein horizontaler Überlauf auf Shop und beiden Detailseiten. Galerie, Lightbox, FAQ und gemischter Warenkorb geprüft (158,90 EUR + 6,19 EUR = 165,09 EUR). Keine Browser-Konsolenfehler auf der neuen Detailseite.
- Lokal: http://127.0.0.1:8791/steel-seed-phrase-recovery-plate.html und http://127.0.0.1:8791/index.html#shop . Vorschau nutzt ausschließlich eine isolierte In-Memory-Datenbank mit Testkonfiguration; Zahlungen/Mailversand sind dort deaktiviert.
- Sicherung des vorgefundenen Arbeitsstands unter `.cache/product2-optimization-baseline`. Frühere uncommittete Änderungen bleiben erhalten. Kein Commit, Push, Merge, Deployment, produktiver Datenbankzugriff oder Änderung an Live-Konfigurationen. Produktionsaktivierung bleibt von der bestehenden Einrichtung und ausdrücklicher Freigabe abhängig.

## Shop-Karten-Redesign – 28.10.2026 (nur lokal)

- Homepage: zwei gleich breite und gleich hohe dunkle Produktkarten, Varianten-Badges, kompakte Beschreibungen, Merkmale, ausgerichtete Kaufbereiche und horizontale Thumbnail-Galerien. Unter 901 px einspaltig. Vergleich nur auf der Homepage entfernt; Detailseiten unverändert.
- Geändert: index.html, assets/app.js (nur Shop-Rendering), assets/products.js (shopDesc/shopImages), neue assets/shop-products.css, Build-Kopierliste und diese Dokumentation. Bestehende Änderungen bleiben erhalten; Sicherung unter .cache/product-cards-baseline.
- Bilder: vorhandenes silbernes Studiofoto als erste 8-Digit-Shopansicht, vorhandene Lieferumfangaufnahme als erste 4-Digit-Shopansicht. Keine Bilddateien oder Produktdetails verändert. Originalgalerien bleiben zugänglich. Vollständig einheitliche Studiohintergründe bleiben offen: acht originale 8-Digit-Fotos haben schwarze Hintergründe; die vier 4-Digit-Aufnahmen unterschiedliche helle Hintergründe/Weißabgleiche. Keine unzuverlässige automatische Retusche vorgenommen.
- Prüfung: 82/82 Tests erfolgreich, pnpm build erfolgreich. Desktop 1440 px, Tablet 1024 px und Mobile 390 px ohne horizontalen Seitenüberlauf geprüft. Desktop-Karten und Kaufbereiche gleich ausgerichtet. Beide Galerien und Lightboxes sowie gemischter Warenkorb geprüft: 158,90 EUR plus einmalig 6,19 EUR ergibt 165,09 EUR. Keine Zahlung oder Mail ausgelöst.
- Lokale Vorschau: http://127.0.0.1:8791/index.html#shop . Kein Commit, Push oder Deployment. Vor Veröffentlichung sind weiterhin Freigabe sowie die getrennten Voraussetzungen der vorbereiteten Produkt-/Bestandsaktivierung erforderlich.


## Karten finalisieren – 28.10.2026 (nur lokal)
- Beide Katalogpreise jetzt 7900 Cent; neue vollständige Namen in Frontend, Serverkatalog, Detailüberschriften und strukturierten Daten. Die früheren Preisangaben dieser Arbeitsdokumentation sind historisch.
- Kompakte Karten mit kurzen Beschreibungen, drei Merkmalen, Produktbeschreibung-Link und manuell bedienbarer Pfeil-/Punkt-/Pointer-Swipe-Galerie statt Thumbnail-Leiste. Originalaufnahmen vollständig erreichbar und unverändert. Vergleichstabellen und Vergleichsabsätze auf beiden Detailseiten entfernt; individuelle Inhalte erhalten.
- Versand-/Steuer-/Lieferhinweise aus Karten in gemeinsame Zeile direkt darunter verschoben; zusätzlich unverändert auf Detailseiten und im Warenkorb. Keine öffentliche Lageranzeige auf Karten; Verfügbarkeitsprüfung und Kaufsperre bleiben erhalten.
- Keine bestätigten Feuer-/Wassernachweise. Deshalb Materialmerkmal: 4-Digit Edelstahl 304 / V2A; 8-Digit nur Edelstahl, da 304 / V2A für dieses Modell weiterhin ungeklärt. Unterschiedliche Originalbildhintergründe bleiben offen.
- Tests: 82/82 bestanden, Build erfolgreich. Desktop gleich große Karten; Mobile ohne horizontalen Überlauf; Pfeile/Tastatur und Pointer-Wischen geprüft. Gemischter Warenkorb: 158,00 EUR + 6,19 EUR = 164,19 EUR. Keine Zahlung/Mail/Produktionsaktion.
- Release-Voraussetzung: Für recoveryplate4 muss ein eigener aktiver einmaliger EUR-Preis mit 7900 Cent zum richtigen Stripe-Produkt existieren; erst nach Freigabe STRIPE_PRICE_ID_PLATE4 darauf konfigurieren. Bestehende IDs/Secrets unverändert. Ein alter 7990-Cent-Preis wird weiterhin von der strikten Preisprüfung abgelehnt. Vor Umstellung offene Checkout-Sessions zum alten Preis prüfen/auslaufen lassen; historische Bestellungen nicht umschreiben. Bestehende Migrations-/Aktivierungsfreigaben bleiben erforderlich. Kein Commit, Push oder Deployment.

## Kompakte silberne Karten – 29.10.2026 (nur lokal)
- Kartenabstände reduziert, silbergraue Karten mit dunkler Typografie; Varianten als eigene Zeile unter dem Titel. Beide Materialmerkmale lauten nun Edelstahl. Positionspunkte ausgeblendet; Pfeile, Tastatur, Wischen und Lightbox bleiben vorhanden.
- Acht separate 8-Digit-Freistellungen mit hellem Hintergrund sowie vier proportionale 4-Digit-Galerievarianten, alle 1536 × 1024 px. Originaldateien unverändert. Nur shopImages verwendet die neuen Dateien; Detailseiten behalten die Originalfotos. Keine generative Fassung verwendet: erste Bildbearbeitung wegen veränderter Details verworfen, danach ausdrücklich genehmigte lokale Freistellung. Keine Produktgeometrie rekonstruiert; kontrollierte Maskierung/Skalierung, Verlustlos-WebP. Unterschiedliche Lichtfarben der originalen 4-Digit-Aufnahmen bleiben erhalten.
- Betroffen: assets/app.js, assets/products.js, assets/shop-products.css, scripts/build.mjs, zwölf neue Bilddateien und diese Dokumentation. Vorheriger Stand gesichert unter .cache/compact-silver-baseline.
- 82/82 Tests erfolgreich, pnpm build erfolgreich. Desktop 1440 px: Karten gleich hoch und Kaufbereiche ausgerichtet. Mobile 390 px: identische Bildflächen, kein horizontaler Seitenüberlauf, keine sichtbaren Verlaufspunkte. Galerie-Pfeilwechsel geprüft. Keine Änderungen an Preisen, Stripe, Datenbank, Checkout oder Produktion. Kein Commit/Push/Deployment.

## Einheitliche 4-Digit-Hintergründe und integrierte Karten – 29.10.2026
- Vier 4-Digit-Studioansichten durch lokale Silhouettenmaskierung auf denselben Hintergrund #ededed wie 8-Digit gesetzt. Opaque Produktinnenflächen vor Skalierung mit Originalpixeln verglichen; keine Rekonstruktion von Logo, Gravuren oder Geometrie. Original-WebP bleiben erhalten; unterschiedliche ursprüngliche Metall-Lichtfarben bleiben bewahrt. Neue 640px-/Thumbnail-Ableitungen für die Studiofotos.
- Einheitliche Fotos in Shop-Katalog, 4-Digit-Detailgalerie und deren strukturierten Bildangaben eingebunden. Anthrazitfarbene Karten mit metallischem Rand, heller Bildbühne und dunkler kompakter Informationsfläche ersetzen die vollflächig hellen Karten. Umgebender Seitenhintergrund bleibt dunkel.
- Betroffen: assets/shop-products.css, assets/products.js, steel-seed-phrase-recovery-plate.html, scripts/build.mjs, vier Studio-WebP und acht neue responsive Ableitungen. Vorherige Fassung unter .cache/integrated-cards-baseline gesichert.
- 82/82 Tests bestanden, Build erfolgreich. Desktop 1440px visuell geprüft; alle vier Galeriequellen durch Pfeile erreichbar; Mobile 390px ohne Seitenüberlauf. Keine Preis-, Zahlungs-, Konfigurations- oder Produktionsänderungen. Kein Commit/Push/Deployment.


## Produkt-2-Release – 29.10.2026 (Vorbereitung)
- Betreiber hat den vollständigen vorbereiteten Stand ausdrücklich produktiv freigegeben. Vorbestehende Mail-/Formular-/Rechts-/SEO-Arbeiten sind Bestandteil des Release, da sie laut LEGAL-TECHNICAL-REVIEW bereits direkt veröffentlicht waren und dem Git-Stand fehlten. Lokale Preview-CSS/-Generatoren bleiben ausgeschlossen.
- Live-Produkt prod_VWh5xI20GvbTi9 und Preis price_1UVdhGIPPGFjbWPMAO5IFnFA über Stripe verifiziert: aktiv, Live, einmalig, EUR 7900. Bestehender Produkt-1-Preis ebenfalls unverändert EUR 7900.
- Production-Konfiguration frisch über Wrangler heruntergeladen, kanonische wrangler.toml mit gleichen bestehenden Variablen und ORDERS-Binding ergänzt. Neuer Preis öffentlich, PLATE4_ENABLED zunächst false. Preview-Kommunikation und neues Produkt deaktiviert. Keine Secrets gelesen/ersetzt.
- D1-Ziel hodlware-orders (54fc8940-9c37-4f90-96d8-9921cfd100f8), Schema 0001/0002 bestätigt; Time-Travel-Wiederherstellungsmarke vor Migration lokal ignoriert gesichert. Migration 0003 erfolgreich, 24 Stück, 0 Reservierungen, vier bestehende bezahlte Bestellungen unverändert. Rückfallstrategie: alten Code deployen und Produkt 2 sperren, additive Tabellen erhalten. Keine destruktive automatische Datenbankwiederherstellung.
- Bestehender Live-Webhook um checkout.session.expired ergänzt; andere drei Ereignisse erhalten. Mail-Worker unverändert aktiv.
- Vollsuite 82/82 bestanden, Produktions-Build und Pages-Functions-Kompilierung erfolgreich. Secret-Musterscan 0 Treffer; Build enthält keine lokalen Pfade und alle referenzierten Assets. Kein echter Zahlungstest.

## Produktionsfreigabe – 29.10.2026
- main und Feature-Branch veröffentlicht. Release 50126e1; Functions-Build explizit im Produktions-Build ergänzt (aca1df9), Produkt 2 danach aktiviert (c22aa70). Cloudflare-Buildbefehl von exit 0 auf pnpm build korrigiert. Direkter Zwischenversuch ohne Functions führte kurzzeitig zum HTML-Fallback der API; durch vollständiges Functions-Deployment behoben und anschließend automatisch über GitHub verifiziert. Keine Secrets geändert.
- Produktions-Checkout: Produkt 1 und Produkt 2 jeweils 8519 Cent; Mischkorb und 2× Produkt 2 jeweils 16419 Cent. Versand jeweils einmal 619 Cent, nur DE, Live-Preise, Rechnungsanlage aktiviert. Vier unbezahlte Prüfsessions ohne Kundendaten erstellt; keine echte Zahlung. Manipulierte Artikel/Preise HTTP400, Überbestand HTTP503, unsignierter Webhook HTTP400.
- D1: Bestand 24; vier bestehende bezahlte Bestellungen unverändert. Drei Prüfsessions halten zusammen vier Einheiten bis zum bestätigten Ablauf. Stripe-Live-Workbench erlaubt expire weder dem Agenten noch manuell; deshalb natürlicher Ablauf nach einer Stunde. Freigabe durch produktiven Ablauf-Webhook noch zu bestätigen; keine manuelle Bestandskorrektur. Produkt-1-Prüfsession läuft separat regulär ab.
- Automatisiert: 82/82 Tests, Build einschließlich Functions erfolgreich. Desktop: gleiche Kartenhöhen, Warenkorb mit Mengenänderung/Entfernen korrekt. Mobile: kein Seitenüberlauf, beide Bilder geladen; erkannten überlappenden Merkmaltext durch ausschließlich mobilen Zeilenumbruch behoben. Produktseiten, Abbruchseite, Sitemap XML und robots.txt erreichbar.
- Mail-Worker unverändert aktiv, Outbox neun versandt, keine wartenden Nachrichten; keine neuen Kundenmails ausgelöst. Erfolgreiche/fehlgeschlagene Zahlung, Doppelzustellung, Reservierungsrennen und Bestellmails automatisiert geprüft. Keine neue erfolgreiche Live-Zahlung, Rechnung/PDF oder Bestellmail-Zustellung dadurch bestätigt. Vollständiger bezahlter E2E-Test erfordert separate Zahlungsfreigabe.

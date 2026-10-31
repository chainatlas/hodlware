# Navigation und Zubehördarstellung – lokale Abnahme

Ausgangspunkt: produktiver Commit `db6b7d5331ab07d6e15c33f8f53d90e2c0b30031` auf `feature/accessories-void-stickers`.
Diese Designänderung ist ausschließlich lokal vorbereitet. Kein Push und kein produktives Deployment, keine Stripe-/D1-/Bestandsänderung.

## Darstellung

- Navigation auf allen Shop-, Rechts- und Ratgeberseiten exakt: **Shop | Zubehör | Über uns | Ratgeber | FAQ | Vertrag widerrufen**. Desktop und Mobil verwenden dieselbe Reihenfolge und je einen Menüeintrag. Vorhandene Linkziele bleiben erhalten; bisher fehlende Menüpunkte erhalten die bestehenden Zielseiten.
- `/zubehoer` nutzt auf Desktop einen breiten zweispaltigen Produktbereich: links Galerie, rechts Kaufbereich; beide beginnen auf derselben Höhe. Auf Mobil folgt der Kaufbereich der Galerie.
- Oben steht ausschließlich die vorgegebene kompakte Beschreibung mit den drei wichtigsten Eigenschaften. Der sachliche Sicherheitshinweis bleibt unterhalb des Kaufbereichs.
- Vier Paketkacheln, orange markierte Auswahl, jeweils exakter Paketpreis. Ausgewählter Paketpreis und Warenkorb-Button direkt unter der Auswahl; Versand- und §19-Hinweise unmittelbar dabei.
- Sticker-only: 1,10 EUR Standardbrief mit Basis-Sendungsverfolgung. Mit Recovery Plate: 6,19 EUR, Versand innerhalb Deutschlands. Serverseitige Versandberechnung unverändert.
- Alle drei Originalfotos unverändert. Hauptbild, Vorschaubilder und Vergrößerung verwenden `object-fit: contain`. Die Fotos verwenden ihr natürliches Seitenverhältnis ohne zusätzlichen weißen Rahmen oder aufgefüllte Balken. Alle Fotoecken bleiben vollständig sichtbar; kein Beschnitt, keine Verzerrung oder künstliche Motivvergrößerung.

## Gemeinsame Galerie

`assets/gallery.js` enthält die aus der bestehenden Plate-Darstellung zusammengeführte Galerielogik. Homepage, Plate-Detailseiten und Zubehör verwenden denselben Initialisierer. Die frühere separate Zubehör-Galerielogik ist entfernt.

Unterstützt: drei Zubehör-Vorschaubilder, Vor-/Zurück-Pfeile, Tastatur, horizontale Maus-/Touch-Gesten, Vergrößerung und Schließen. Vorhandene Plate-Galerien und Homepage-Karussells sind mitgeprüft. Ratgeberseiten laden nun ebenfalls den Zubehörkatalog, damit ihr Warenkorb beim Seitenwechsel keine Zubehörpositionen verliert.

## Nachweise

- **130 automatisierte Tests bestanden**, 0 fehlgeschlagen.
- **323 Playwright-Prüfungen bestanden**: 1440×1000, 1024×900, 768×1024, 600×900, 390×844, 320×740.
- **Produktions-Build erfolgreich**: statische Dateien, Bilder, SEO-/IndexNow-Manifest und Pages-Worker.
- Keine externen Requests, JavaScript-Laufzeitfehler oder fehlenden Assets im lokalen Browsertest.
- Navigation, Desktop-Spalten, mobile Reihenfolge, alle drei Bilder einzeln, Bild-/Thumbnail-/Pfeil-/Tastaturwechsel und echte Touch-Gesten geprüft.
- Alle vier Paketpreise und die jeweils angezeigte Auswahl geprüft. Warenkorb, Mengenänderung, Entfernen, persistierter Warenkorb und gemischter Versand bestehen weiterhin.
- Im Desktop-Test 1440×1000 ist der Warenkorb-Button ohne langes Scrollen innerhalb des ersten Viewports erreichbar, sogar mit zusätzlichem lokalen Demo-Banner.
- Bytevergleich beider Plate-HTML-Dateien gegen den Ausgangscommit: ausschließlich Navigation und Einbindung des gemeinsamen Galerie-Skripts verändert. Produkttexte, Bilder und SEO unverändert.
- Keine Änderungen in `server/`, `migrations/`, `operations/`, `wrangler.toml` oder den Produkt-/Variantendaten. Keine produktiven Checkout-Prüfsessions angelegt.

## Screenshots und Wiederholung

Alle Nachweise: `artifacts/accessories-layout-review/`.

- `desktop.png`, `mobile.png`: vollständige neue Seiten.
- `desktop-photo-1.png` bis `desktop-photo-3.png`: jedes Originalfoto auf Desktop.
- `mobile-photo-1.png` bis `mobile-photo-3.png`: jedes Originalfoto auf Mobil.
- Entsprechende Aufnahmen auch für `small-desktop`, `tablet`, `wide-mobile`, `small-mobile`.
- `*-sticker-cart.png` / `*-mixed-cart.png`: Warenkorb und Versand.
- `results.json`: einzelne Browserprüfungen; `unit-tests.txt` und `build.txt`: vollständige Test-/Build-Ergebnisse.

Lokale Vorschau nach dem Build: `node scripts/preview-accessories.mjs`; standardmäßig `http://127.0.0.1:8788/zubehoer`, optional über `PREVIEW_PORT` auf einen anderen lokalen Port legen. Der Vorschauserver verwendet simulierte Verfügbarkeit und blockiert echte Zahlungen/Mails.

Wiederholung: `npm test`, `npm run build`, danach `node scripts/qa-accessories.mjs` mit lokal verfügbarem Playwright und Chrome. Auf diesem Rechner wird Playwright über die vorhandene Codex-Laufzeit via `NODE_PATH` aufgelöst. Der Browsertest startet/beendet seinen eigenen lokalen Server und blockiert alle externen Anfragen.

**Vor einer Veröffentlichung ist die neue Darstellung visuell abzunehmen.** Die bestehende Produktionsfreigabe wird für diesen Designstand nicht als automatische Deployment-Freigabe ausgelegt.

## Nachkorrektur: durchgehender Bildhintergrund

Der zusätzliche weiße Rahmen und die feste 3:2-Bildfläche wurden entfernt. Hauptbilder und Vorschaubilder erscheinen im natürlichen Seitenverhältnis, sodass ausschließlich der originale silberne Fotohintergrund sichtbar bleibt. Kein Retuschieren oder Generieren von Bildinhalten. Die Playwright-Prüfung vergleicht für jedes der drei Fotos zusätzlich das gerenderte mit dem natürlichen Seitenverhältnis und prüft, dass die Bildfläche keine zusätzlichen vertikalen Balken erzeugt. Weiterhin nur lokal, ohne Veröffentlichung.

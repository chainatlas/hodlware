# HODLWARE – SEO Phase 3: Abschlussbericht zur Freigabe

Stand: 01.11.2026. Branch **feature/seo-phase-3**, Ausgangscommit **b3c3d689b1b4b8f65124017f335a628e8dd52673**. Dieser Stand ist per GitHub-fetch als aktueller main bestätigt. **Keine produktive Veröffentlichung.**

Repositorywurzel: `C:/Users/Home One/Desktop/TinyMotchi/hodlware-accessories/`. Pfade in diesem Bericht relativ dazu. Der abschließende Feature-Commit wird in der Abschlussantwort angegeben; Bericht und Nachweise sind Teil dieses Commits.

## Ergebnis nach Arbeitspaketen A–G

**A – Bestandsaufnahme:** Alle vorhandenen drei Ratgeber, beide Plates, Zubehör, Startseite, Navigation, Metadaten, strukturierte Daten, Sitemap und Canonicals gelesen und gegen den Produktionsstand eingeordnet. 13 bestehende kanonische Seiten sind öffentlich HTTP 200. Die beiden geplanten neuen URLs sind öffentlich erwartungsgemäß noch 404. Nach lokalem Build sind alle 15 kanonischen URLs erreichbar und indexierbar. Vollständige Liste einschließlich Zahlungsseiten, Fehlerdokument, Versand-Alias, Parametervarianten und technischen Routen: **URL-INVENTAR.md**, Rohdaten **url-inventory.json** und **production-baseline.json**.

**B – Suchstrategie:** In **KEYWORD-STRATEGIE.md** ist jede relevante Intention genau einem primären Dokument zugewiesen. Die Themen Aufbewahrung, Materialvergleich, Umsetzung, Grundlagen/Wortzahl und BIP39 werden getrennt. Für verlorene Recovery Phrases genügt ein gezielter Abschnitt des Grundlagenartikels; kein zusätzlicher dünner Artikel. Kein verwendbarer GSC-Rohdatenexport im Projekt. Die übermittelten drei historischen Suchbegriffe sind nur Hinweise. **Alle Suchvolumina, Positionen und Klickprognosen bleiben unbekannt.** Kein künstlicher STEELQR-Artikel und keine QR-Produkteigenschaften erfunden.

**C – Bestehende Ratgeber:** Sinnvolle vorhandene Kernerklärungen erhalten und alle drei Artikel vollständig im Zusammenhang überarbeitet: Einordnung, logische Kapitel, praktische Hinweise, FAQ, Inhaltsverzeichnis, passende Produktentscheidung und thematische Querverweise. Bestehende SEO-Titel/Meta-Beschreibungen aus Phase 2 bleiben, weil sie die jeweilige Intention bereits klar bedienen. Article-Daten werden an die tatsächlich sichtbaren H1-/Meta-Inhalte angeglichen.

**D – Echte Lücken:** Genau zwei neue eigenständige Artikel: Grundlagen/12 oder 24 Wörter sowie englische BIP39-Vier-Buchstaben-Regel. Keine zweite Aufbewahrungsseite und kein zweiter Papier-/Metall-Vergleich. Neue Artikel sind vollständig verfasst, nicht nur Entwürfe.

**E – Nutzerführung:** Startseiten-Ratgeberabschnitt führt jetzt zu allen fünf Artikeln. Grundlagen → Aufbewahrung → Material/Verfahren → passende Plate. Produktseiten verlinken die relevanten neuen Erklärungen. Zurückhaltende Produktlinks im Kontext; kein Zubehör-Upsell auf Plates, keine neue Stickerkarte auf der Startseite, keine Pop-ups oder Verknappung. Zubehör bleibt eigenständiger bestehender Katalog; der Aufbewahrungsartikel verlinkt ihn nur zur konkreten Frage nach Manipulationshinweisen.

**F – Technische Umsetzung:** Beide neuen HTML-Seiten im bestehenden Build und in der Sitemap registriert. Alle bisherigen URLs, Weiterleitungen und Canonicals erhalten. Neue Artikel mit eigenem Canonical, Article-Markup, bestehenden lokalen Assets und identischem HODLWARE-Grunddesign. Keine neuen Bilddownloads oder künstlichen Illustrationen. Verbesserte CSS-Regeln strikt auf .guide begrenzt. Keine Änderung an Produkt-Sicherheitsversprechen oder operativen Shopdiensten.

**G – QA:** Build, automatisierte Tests, vollständige Shop-Regression sowie Desktop-/Mobil-/320-Pixel-Contentprüfungen durchgeführt. Bei Sichtprüfungen gefundene Artikel-TOC- und Überlagerungsfehler korrigiert und danach gezielt nachgetestet. Details unten.

## Neue und geänderte Seiten

### Neue Seiten

1. **ratgeber/was-ist-eine-seed-phrase.html**
   - URL: /ratgeber/was-ist-eine-seed-phrase
   - Titel: „Was ist eine Seed Phrase? 12 oder 24 Wörter | HODLWARE“
   - H1: „Was ist eine Seed Phrase? 12 und 24 Wörter erklärt“
   - Meta: Begriff und Bitcoin Recovery Phrase, Wortzahl, PIN/Passphrase, verlorenes Backup.
   - Eigenständiger Nutzen: Grundlagen ohne direkte Kaufvoraussetzung; Unterschiede der Geheimnisse; Wortzahl nicht eigenmächtig ändern; bei verlorenem Backup keine voreiligen Resets und keine Wiederherstellungsgarantien.
   - Primäre Abschnitte #wortzahl und #verloren bilden die zugehörigen Suchintentionen ab.

2. **ratgeber/bip39-vier-buchstaben.html**
   - URL: /ratgeber/bip39-vier-buchstaben
   - Titel: „BIP39: Vier Buchstaben der englischen Wortliste | HODLWARE“
   - H1: „BIP39: Wann reichen die ersten vier Buchstaben?“
   - Meta: Bedingungen, kurze Wörter und passende physische Sicherung.
   - Eigenständiger Nutzen: englische Wortliste als Voraussetzung, kurze Wörter vollständig, Positionen/Reihenfolge erhalten, Kennungen nicht verschlüsselt, Wiederherstellung ggf. mit vollständigen Wörtern und unterstützter Walletoberfläche.
   - Kein universelles Versprechen für andere Sprachen, Wortlisten, Passphrases oder Walletstandards.

### Bestehende Seiten

3. **ratgeber/seed-phrase-sicher-aufbewahren.html**
   - Vorhandene Lager-/Zugriffs-/Kopienhinweise um konkrete Planungscheckliste ergänzt.
   - Manipulationsindikatoren sachlich eingeordnet, dezenter Link zum Zubehör.
   - FAQ zu gemeinsamem Lagerort, Fotos und verlorenem Backup. Verweis zur neuen Einführung statt inhaltlicher Dopplung.

4. **ratgeber/seed-phrase-papier-oder-metall.html**
   - Vorhandenen tabellarischen Materialvergleich behalten; drei praktische Entscheidungsfragen mit H3-Struktur ergänzt.
   - Einrichtbarkeit, Lagerort und Kontrolle statt unbelegter Haltbarkeitsgarantien.
   - FAQ zu Papier und fehlender pauschaler Feuerfestigkeit von Metall. Link zur BIP39-Bedingung bei Vier-Zeichen-Modellen.

5. **ratgeber/seed-phrase-auf-metall-sichern.html**
   - Bestehende Schritte ergänzt um klare Zuordnung 4-Digit/8-Digit und unterstützte Wortzahlen.
   - Widerspruchsrisiko „nie kürzen“ präzisiert: nur nach unterstützter Wortliste sowie Produkt-/Walletanleitung abkürzen.
   - FAQ zu Einlegebuchstaben statt Stanzwerkzeug, neutralem Üben und unklaren Kennungen.

6. **index.html**
   - Bestehender Ratgeberbereich enthält zusätzlich Grundlagen- und BIP39-Einstieg.
   - Keine Änderung an Hero, Produktangeboten, Preisen oder Startseiten-Produktkarten.

7. **steel-seed-phrase-recovery.html**
   - Ein kontextueller Link zum Grundlagen-/Wortzahlartikel ergänzt.
   - Sonstige Produkttexte, Preise, Sicherheitsversprechen, Bilder und Markup unverändert.

8. **steel-seed-phrase-recovery-plate.html**
   - Ein kontextueller Link zur detaillierten englischen BIP39-Regel ergänzt.
   - Sonstige Produkttexte, Preise, Sicherheitsversprechen, Bilder und Markup unverändert.

**Zubehörseite:** Vollständig geprüft, aber nicht redaktionell verändert. Die vorhandenen Maße, Paketdaten und Grenzen des Manipulationsindikators sind bereits passend. Keine unnötige Überarbeitung.

## Fachliche Prüfung und Quellen

- [BIP39-Originalspezifikation](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki): Wortzahlen und Bedingungen des Verfahrens.
- [Offizielle englische Wortliste](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt): technische Gegenprüfung mit scripts/verify-bip39-list.mjs.
- [Trezor: Umgang mit einem Wallet-Backup](https://trezor.io/guides/backups-recovery/general-standards/how-to-use-a-wallet-backup): Hinweise zu Vertraulichkeit und Herstellerabläufen; keine universelle Kompatibilitätszusage abgeleitet.

Die englische Liste wurde rein lesend geladen und gehasht. Ergebnis: **2.048 Wörter, 2.048 unterschiedliche Kennungen aus bis zu vier Anfangsbuchstaben**. Wörter unter vier Zeichen werden als vollständige Wörter behandelt, nicht als frei gewählte Präfixe längerer Wörter. SHA-256 und Quell-URL in bip39-verification.json. Keine Seed Phrase erzeugt, verwendet, abgefragt oder hochgeladen. Die Prüfung untersucht nur eine öffentliche Wortliste.

Weiter geprüft: BIP39 erlaubt 12/15/18/21/24 Wörter; das Sortiment unterstützt deshalb nicht automatisch alle diese Längen. Der Text trennt Standardumfang und konkrete Plate-Kapazität. Zusätzliche Passphrase ist kein beliebiges zusätzliches Listenwort. Vier Zeichen sind keine Verschlüsselung. Eine Prüfsumme garantiert nicht, dass das richtige Walletbackup vorliegt. Keine universellen Recovery-Erfolgsversprechen.

## Technische Änderungen

- **scripts/build.mjs:** zwei neue HTML-Ratgeber in der bestehenden guides-Liste; sie erhalten die bisherigen Assetversionen/Favicons und gelangen in das IndexNow-Buildmanifest.
- **sitemap.xml:** nur zwei neue kanonische URLs ergänzt, Gesamtzahl 15. Keine Parametervarianten oder Anker als neue Indexziele.
- **assets/seo-content.css:** Artikel-TOC, verwandte Artikel, Fokusumrandung und mobile Umbrüche, auf .guide begrenzt. Shop-/Checkoutlayout unverändert.
- **Fünf Artikel:** semantisches HTML mit genau einer H1, strukturierten H2/H3, keyboardbedienbaren details/summary und überprüften Inhaltsankern. Article-Metadaten entsprechen sichtbaren Inhalten; keine unsichtbaren FAQPage-Daten oder erfundenen Autoren-/Veröffentlichungsangaben.
- Inhaltsverzeichnislinks enthalten den vollständigen Artikelpfad: wegen des bestehenden base href=/ würde ein nacktes #Fragment sonst auf die Startseite zeigen.
- Redundante schwebende Widerrufsverknüpfung nur auf den fünf Ratgebern entfernt, da sie auf Mobilgeräten Inhaltslinks überlagerte. Widerruf in Hauptnavigation und Footer erhalten; Rechtsseiten, Formulare und Prozesse unverändert.
- **scripts/qa-seo-phase3.mjs:** eigenständiger lokaler Content-/Link-/Schema-/Responsive-Prüfer.
- **scripts/verify-bip39-list.mjs:** reproduzierbare lesende Quellenprüfung; kein Bestandteil des normalen CI-Builds und kein Walletgenerator.

## Tests und visuelle Kontrolle

- Vollständige vorhandene Testsuite: **133 Tests bestanden**.
- Produktions-Build: erfolgreich, inklusive Worker und aller 15 Sitemap-Seiten.
- Vollständige bestehende Shop-QA: **323 Browserprüfungen bestanden**, sechs Viewports; Paketwahl, Preise, Warenkorb, gemischte Bestellungen, Versand, Navigation, Galerien und sicher blockierter lokaler Checkout.
- Lokale Cloudflare-Pages-QA: **144 Prüfungen bestanden**; echte 404, alle 15 gültigen Ziele/.html-Weiterleitungen, historische Redirects, alle Galerien und Lightbox. Mehr Prüfungen als zuvor durch zwei neue Sitemap-Ziele.
- Phase-3-QA: **655 Prüfungen bestanden**, Details in browser-tests.txt und browser-results.json. Desktop 1440, Mobil 390 und schmal 320 Pixel; alle Schwerpunktseiten und fünf Artikel, 69 unterschiedliche interne Ziel-/Ankerkombinationen, korrekte Article-Daten, FAQ-Tastaturbedienung, keine horizontalen Überläufe, keine Browser-Laufzeitfehler.
- Gezielte Navigation-/Produkttexttests nach mobilen Korrekturen erneut bestanden. Keine unnötige Wiederholung der gesamten Shop-Suite nach ausschließlich artikellokalen Korrekturen.
- Exakte Artikelduplikate durch normalisierte Körpertexte/Hashes ausgeschlossen; Suchintentionen zusätzlich redaktionell geprüft. Gemeinsame Navigation und kurze notwendige Sicherheitshinweise sind keine neuen eigenständigen Suchthemen.
- Bildpfade und Phase-1-Bildoptimierung unverändert; vollständige Galerieansichten in der Regression geprüft. Keine neuen Bilder erforderlich.
- 18 Vollseiten-Screenshots plus gut lesbare viewportbasierte Ansichten in diesem Ordner. Sichtprüfung von neuem BIP39-Artikel, Grundlagenartikel, bestehendem Vergleich und Startseitenaufbau. Lokale Demobanner gehören nur zum Testserver, nicht zum Buildinhalt.

Gefundene und behobene Darstellungs-/Navigationsfehler: zunächst fälschlich globale Warenkorb-H2 im Inhaltsverzeichnis; TOC auf Article begrenzt und per Browserassertion abgesichert. Schwebender doppelter Widerrufslink auf Mobilgeräten überlagerte Artikelinhalt; artikelbezogen entfernt und Zugänglichkeit der übrigen Widerrufslinks nachgetestet.

## Unveränderte Bereiche und Prüfgrenzen

Keine Änderungen unter server/, functions/, migrations/, operations/, wrangler.toml, in Produkt-/Preiskatalogen, Galerie- und Checkoutskripten, Bestandslogik, Stripe, Versandtarifen oder Bestellabwicklung. Die beiden Produkt-HTML-Seiten erhalten ausschließlich neue Wissenslinks. Keine Produkttests, Zertifikate, Rankings, Kundenbewertungen oder Suchvolumina erfunden.

Es gab keine neue Live-Checkout-Session, Reservierung, Zahlung oder Testbestellung. Checkoutbereitschaft und Einbindung wurden lokal mit den bestehenden Fixtures geprüft; zusätzlich meldete der öffentliche rein lesende /api/checkout-context-Aufruf HTTP 200 und ready:true (checkout-readiness.json); das ist keine neu getestete echte Zahlungskette. Produktionszugriffe für das Inventar waren ausschließlich lesende HTML-/Checkout-Kontext-Abfragen und Git-fetch, kein Deployment.

## Offene Risiken und Veröffentlichungsempfehlung

1. Keine aktuellen GSC-Rohdaten und keine Suchvolumenmessung. Priorisierung beruht auf inhaltlicher Abdeckung und sachlicher Intention, nicht auf Prognosen.
2. Google kann neue Seiten erst nach Veröffentlichung crawlen. Indexierung, Google-selected Canonicals, Rich Results und Rankings dieser Fassung sind nicht bestätigt. Kein neuer offizieller Google-Test behauptet; die bekannte technische Fehlermeldung der bisherigen Rich-Results-Prüfungen bleibt ein separater offener Punkt aus Phase 2.
3. Sachlich korrekte allgemeine Backuptexte ersetzen keine Wallet-/Produktherstelleranleitung. Walletstandards und konkrete Implementierungen müssen Nutzer passend zu ihrer Situation prüfen.
4. Vor einer späteren Veröffentlichung main/Produktionsstand erneut abgleichen und dann öffentlich die neuen URLs, Canonicals, Anker und Sitemap prüfen. GSC anschließend beobachten; bei kleinem Datenvolumen keine schnellen Rankingurteile.

**Empfehlung: lokal zur Abnahme und Veröffentlichung nach ausdrücklicher Freigabe geeignet.** Alle Arbeitspakete umgesetzt, kritische lokal gefundene Fehler behoben. Keine neue D1-Migration, Stripe-Konfiguration oder Bestandsinitialisierung notwendig. Rollback wäre ein Code-/Pages-Rollback auf den vorherigen kompatiblen Phase-2-Stand, ohne Datenbank oder Zahlungen anzutasten. Keine produktive Veröffentlichung ohne erneute Freigabe.

Weitere Dokumente: URL-INVENTAR.md, KEYWORD-STRATEGIE.md. Rohbelege: production-baseline.json, url-inventory.json, content-checks.json, bip39-verification.json, browser-results.json, tests.txt, regression-browser.txt, routing-gallery-tests.txt und build.txt.


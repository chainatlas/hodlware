# Vollständiges SEO-URL-Inventar – Phase 3

Stand 01.11.2026. 13 bestehende und zwei neue kanonische Inhaltsseiten. Alle 15 lokal HTTP 200, selbstreferenzieller Canonical, kein noindex und in Sitemap. Neue URLs bleiben öffentlich bis zur Freigabe 404.

| URL | Quelldatei | Produktion vor Phase 3 | lokales Indexziel |
|---|---|---:|---|
| https://hodlware.de/ | `index.html` | 200 | ja |
| https://hodlware.de/steel-seed-phrase-recovery | `steel-seed-phrase-recovery.html` | 200 | ja |
| https://hodlware.de/kontakt | `kontakt.html` | 200 | ja |
| https://hodlware.de/impressum | `impressum.html` | 200 | ja |
| https://hodlware.de/datenschutz | `datenschutz.html` | 200 | ja |
| https://hodlware.de/agb | `agb.html` | 200 | ja |
| https://hodlware.de/widerruf | `widerruf.html` | 200 | ja |
| https://hodlware.de/versand-zahlung | `versand-zahlung.html` | 200 | ja |
| https://hodlware.de/ratgeber/seed-phrase-sicher-aufbewahren | `ratgeber/seed-phrase-sicher-aufbewahren.html` | 200 | ja |
| https://hodlware.de/ratgeber/seed-phrase-papier-oder-metall | `ratgeber/seed-phrase-papier-oder-metall.html` | 200 | ja |
| https://hodlware.de/ratgeber/seed-phrase-auf-metall-sichern | `ratgeber/seed-phrase-auf-metall-sichern.html` | 200 | ja |
| https://hodlware.de/steel-seed-phrase-recovery-plate | `steel-seed-phrase-recovery-plate.html` | 200 | ja |
| https://hodlware.de/zubehoer | `zubehoer.html` | 200 | ja |
| https://hodlware.de/ratgeber/was-ist-eine-seed-phrase | `ratgeber/was-ist-eine-seed-phrase.html` | 404 | ja |
| https://hodlware.de/ratgeber/bip39-vier-buchstaben | `ratgeber/bip39-vier-buchstaben.html` | 404 | ja |

## Weitere HTML-Adressen und Varianten

| Adresse / Gruppe | Bedeutung / Behandlung |
|---|---|
| /checkout-success, /checkout-cancel | Bestehende Zahlungs-Ergebnisseiten, Meta-noindex, nicht in Sitemap; keine Zahlungstests vorgenommen |
| /versand | Bestehender 200-Alias mit Canonical /versand-zahlung, nicht in Sitemap; in dieser Contentphase unverändert |
| /404 und /404.html | Technisches Fehlerdokument mit noindex; unbekannte Pfade liefern 404, kein Indexziel |
| Jeweilige .html-Dateiadressen aller Inhaltsseiten, /index.html | Pages-Weiterleitung zur endungslosen URL bzw. /; keine zusätzlichen Indexziele |
| /ratgeber/seed-phrase-auf-metall-stanzen und .html | Unveränderte historische 301-Weiterleitung auf /ratgeber/seed-phrase-auf-metall-sichern |
| /zubehoer?paket=1, ?paket=5, ?paket=10, ?paket=25 | Vorhandene vorausgewählte Paketansichten; alle Canonical /zubehoer, nicht zusätzlich in Sitemap |
| /#home, /#shop, /#about, /#ratgeber, /#faq | Abschnitte der Startseite, keine eigenständigen Dokumente |
| Artikelanker #wortzahl, #verloren, #bedingungen, #produktwahl und #abschnitt-* | Inhaltssprünge, Canonical bleibt jeweiliger Artikel |
| http://hodlware.de/* und https://www.hodlware.de/* | Bestehende Weiterleitungen auf HTTPS-Hauptdomain; keine Änderung |
| https://hodlware.pages.dev/* | Bestehender alternativer Host mit Canonicals auf hodlware.de; kein neues Indexziel |

## Technische Routen ohne Content-Ziel

/robots.txt, /sitemap.xml, /indexnow-manifest.json und die bestehende öffentliche IndexNow-Schlüsseldatei bleiben technische Dokumente. /assets/* enthält Bilder, CSS und JavaScript, keine zusätzlichen Artikel. Alle verwendeten Artikelbilder bleiben unverändert.

API-Routen aus dem Repository: /api/checkout-context, /api/checkout-status, /api/create-checkout-session, /api/stripe-webhook, /api/form-context, /api/contact, /api/withdrawals. Diese sind durch robots.txt für Crawling ausgeschlossen, nicht in Sitemap und in Phase 3 vollständig unverändert. Kein API-Schreibaufruf zur Inventarisierung.

Das Inventar umfasst alle ausgelieferten HTML-Dokumente, kanonischen SEO-Ziele und relevanten Varianten. Einzelne statische Bilddateien sind keine eigenen Seiten; deren Dateien/Varianten sind in den bisherigen Bildmanifesten erfasst. Statusangaben der 15 SEO-Seiten sind direkt belegt in production-baseline.json und browser-results.json.

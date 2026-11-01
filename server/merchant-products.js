// Merchant presentation only. Prices and fulfilment remain owned by CATALOG.
// Owner confirmed on 2026-11-01: no GTIN/EAN or manufacturer MPN assigned.
export const MERCHANT_PRODUCTS=Object.freeze({
 seedplate:{title:'HODLWARE Seed Phrase Backup aus Edelstahl – 8-Digit',path:'/steel-seed-phrase-recovery',images:['assets/images/steel-recovery-8-digits-01-optimized.webp','assets/images/steel-recovery-8-digits-03-optimized.webp'],productType:'Sicherheit & Aufbewahrung > Physische Wallet-Backups',identifiers:{status:'unassigned'}},
 recoveryplate4:{title:'HODLWARE Recovery Plate – 4-Digit BIP39',path:'/steel-seed-phrase-recovery-plate',images:['assets/images/recovery-plate-4-digits-studio-01.webp','assets/images/recovery-plate-4-digits-studio-03.webp'],productType:'Sicherheit & Aufbewahrung > Physische Wallet-Backups',identifiers:{status:'unassigned'}},
 ...Object.fromEntries([1,5,10,25].map(n=>['void-'+n,{path:'/zubehoer?paket='+n,productType:'Sicherheit & Aufbewahrung > Manipulationsindikatoren',identifiers:{status:'unassigned'},multipack:n>1?n:undefined}]))
});

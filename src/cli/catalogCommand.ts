export function runCatalog(): void {
  console.log('\x1b[36m%s\x1b[0m', '=== INUO Global Catalog: Canonical Verbs & Complements ===\n');

  const catalog = [
    { verb: 'Request', complement: 'Donate', example: 'Need: Food packet | Offer: Packaged meals' },
    { verb: 'Buy', complement: 'Sell', example: 'Need: Bicycle | Offer: Used mountain bike' },
    { verb: 'Seek', complement: 'Offer', example: 'Need: Career mentor | Offer: Industry professional' },
    { verb: 'Need', complement: 'Fulfill', example: 'Need: Emergency shelter | Offer: Temporary housing' },
    { verb: 'Borrow', complement: 'Lend', example: 'Need: Construction tools | Offer: Equipment loan' },
    { verb: 'Consult', complement: 'Advise', example: 'Need: Legal inquiry | Offer: Legal counsel' },
    { verb: 'Search', complement: 'Supply', example: 'Need: Rare blood type | Offer: Blood bank inventory' },
    { verb: 'Call', complement: 'Respond', example: 'Need: Crisis help | Offer: Emergency support' },
    { verb: 'Volunteer', complement: 'Coordinate', example: 'Need: Event staff | Offer: Volunteer coordination' },
    { verb: 'Report', complement: 'Action', example: 'Need: Road hazard | Offer: Maintenance crew' },
    { verb: 'Ride', complement: 'Drive', example: 'Need: Commute to work | Offer: Shared ride' },
    { verb: 'Talk', complement: 'Listen', example: 'Need: Someone to talk to | Offer: Active listener' },
    { verb: 'Transport', complement: 'Carry', example: 'Need: Goods relocation | Offer: Trucking service' },
    { verb: 'Deliver', complement: 'Fetch', example: 'Need: Package delivery | Offer: Courier service' },
    { verb: 'Employ', complement: 'Teach', example: 'Need: School requires staff | Offer: Teacher availability' },
    { verb: 'Contract', complement: 'Nurse', example: 'Need: Patient requires home visit | Offer: Nursing care' },
    { verb: 'Recruit', complement: 'Apply', example: 'Need: Organization needs help | Offer: Employment seeker' },
    { verb: 'Offer', complement: 'Accept', example: 'Need: Employer offers position | Offer: Candidate accepts' },
    { verb: 'Interview', complement: 'Attend', example: 'Need: Company requests interview | Offer: Candidate attends' },
  ];

  console.log(`\x1b[1m${'NEED VERB'.padEnd(12)} | ${'COMPLEMENT'.padEnd(14)} | EXAMPLE SCENARIO\x1b[0m`);
  console.log(''.padEnd(70, '-'));

  for (const item of catalog) {
    console.log(`${item.verb.padEnd(12)} | ${item.complement.padEnd(14)} | ${item.example}`);
  }
}

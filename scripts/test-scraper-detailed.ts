import { LaytonBreaksScraper } from '../lib/scrapers/layton-breaks';

async function testScraper() {
  const url = process.argv[2] || 'https://laytonsportscards.com/collections/live-breaks/products/2025-panini-donruss-football-hobby-box-6-box-break-2-pick-your-team';

  console.log('Testing scraper with URL:', url);
  console.log('-----------------------------------\n');

  const scraper = new LaytonBreaksScraper();

  try {
    await scraper.init();
    const result = await scraper.scrapeBreakPage(url);

    console.log('\n=== SCRAPING RESULTS ===');
    console.log('Title:', result.title);
    console.log('Product Type:', result.productType);
    console.log('Total teams found:', result.teams.length);
    console.log('Available teams:', result.availableTeams);
    console.log('Average price:', `$${result.averagePrice.toFixed(2)}`);
    console.log('Total value:', `$${result.totalValue.toFixed(2)}`);
    console.log('Available value:', `$${result.availableValue.toFixed(2)}`);

    console.log('\n=== TEAM DETAILS ===');
    console.log('Available Teams:');
    result.teams
      .filter(t => t.available)
      .sort((a, b) => a.teamName.localeCompare(b.teamName))
      .forEach(team => {
        console.log(`  ✓ ${team.teamName.padEnd(30)} $${team.price.toFixed(2)}`);
      });

    console.log('\nSold Out Teams:');
    result.teams
      .filter(t => !t.available)
      .sort((a, b) => a.teamName.localeCompare(b.teamName))
      .forEach(team => {
        console.log(`  ✗ ${team.teamName.padEnd(30)} $${team.price.toFixed(2)}`);
      });

    // Count check
    const nflTeams = [
      'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
      'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
      'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
      'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
      'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
      'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
      'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
      'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
    ];

    console.log('\n=== MISSING TEAMS CHECK ===');
    const foundTeamNames = result.teams.map(t => t.teamName);
    const missingTeams = nflTeams.filter(team =>
      !foundTeamNames.some(found => found.toLowerCase().includes(team.toLowerCase().split(' ').pop()))
    );

    if (missingTeams.length > 0) {
      console.log('Missing teams from scrape:');
      missingTeams.forEach(team => console.log(`  - ${team}`));
    } else {
      console.log('All 32 NFL teams found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await scraper.close();
  }
}

testScraper().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
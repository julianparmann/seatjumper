import axios from 'axios';
import * as cheerio from 'cheerio';
import { BreakDetails, Sport } from '@/types';
import { addDays, format, parse } from 'date-fns';

export class LaytonBreakScraper {
  private baseUrl = 'https://laytonsportscards.com';

  async getBreaksForDate(date: Date): Promise<BreakDetails[]> {
    try {
      // Fetch the break schedule page
      const response = await axios.get(`${this.baseUrl}/pages/break-schedule`);
      const $ = cheerio.load(response.data);

      const breaks: BreakDetails[] = [];

      // Parse break items - this will need adjustment based on actual HTML structure
      // Since we can't see the exact structure, this is a template
      $('.break-item, .product-item, [data-break]').each((_, element) => {
        const $el = $(element);

        const breakData: BreakDetails = {
          id: $el.attr('data-id') || this.generateId(),
          sport: this.parseSport($el.find('.sport, .category').text()),
          productName: $el.find('.product-name, .title, h3').text().trim(),
          breakDate: this.parseDate($el.find('.date, .break-date').text()),
          price: this.parsePrice($el.find('.price, .cost').text()),
          spotsAvailable: parseInt($el.find('.spots-available').text()) || undefined,
          spotsTotal: parseInt($el.find('.spots-total').text()) || undefined,
          breaker: 'Layton Sports Cards',
          streamUrl: $el.find('.stream-link, a[href*="youtube"]').attr('href'),
        };

        // Filter for breaks on the specified date
        if (this.isSameDay(breakData.breakDate, date)) {
          breaks.push(breakData);
        }
      });

      return breaks;
    } catch (error) {
      console.error('Error scraping breaks:', error);
      return [];
    }
  }

  async getBreaksFromProducts(eventDate: Date): Promise<BreakDetails[]> {
    try {
      // For MVP, we'll search for products and filter by date
      // This searches the products/collections endpoint
      const nextDay = addDays(eventDate, 1);
      const searchDate = format(nextDay, 'yyyy-MM-dd');

      // Try multiple endpoints
      const endpoints = [
        `/collections/all-breaks`,
        `/collections/baseball-breaks`,
        `/collections/basketball-breaks`,
        `/collections/football-breaks`,
      ];

      const allBreaks: BreakDetails[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.baseUrl}${endpoint}`);
          const $ = cheerio.load(response.data);

          // Parse product grid items
          $('.product-item, .grid-item, .product-card').each((_, element) => {
            const $el = $(element);

            const title = $el.find('.product-title, .product-name, h3, h4').text().trim();
            const priceText = $el.find('.product-price, .price').text().trim();

            if (title && priceText) {
              const breakData: BreakDetails = {
                id: $el.attr('data-product-id') || this.generateId(),
                sport: this.parseSportFromTitle(title),
                productName: title,
                breakDate: nextDay, // Default to next day after event
                price: this.parsePrice(priceText),
                breaker: 'Layton Sports Cards',
                streamUrl: 'https://www.youtube.com/@laytonsportscards',
              };

              allBreaks.push(breakData);
            }
          });
        } catch (err) {
          console.error(`Error fetching ${endpoint}:`, err);
        }
      }

      return allBreaks;
    } catch (error) {
      console.error('Error scraping products:', error);
      return [];
    }
  }

  private parseSport(text: string): Sport {
    const normalized = text.toLowerCase();

    if (normalized.includes('football') || normalized.includes('nfl')) return Sport.NFL;
    if (normalized.includes('basketball') || normalized.includes('nba')) return Sport.NBA;
    if (normalized.includes('baseball') || normalized.includes('mlb')) return Sport.MLB;
    if (normalized.includes('hockey') || normalized.includes('nhl')) return Sport.NHL;
    if (normalized.includes('soccer')) return Sport.SOCCER;
    if (normalized.includes('ufc') || normalized.includes('mma')) return Sport.UFC;
    if (normalized.includes('f1') || normalized.includes('formula')) return Sport.F1;

    return Sport.OTHER;
  }

  private parseSportFromTitle(title: string): Sport {
    const normalized = title.toLowerCase();

    // Check for specific product lines that indicate sport
    if (normalized.includes('topps') && !normalized.includes('ufc')) return Sport.MLB;
    if (normalized.includes('panini') && normalized.includes('football')) return Sport.NFL;
    if (normalized.includes('prizm') && normalized.includes('basketball')) return Sport.NBA;
    if (normalized.includes('upper deck') && normalized.includes('hockey')) return Sport.NHL;

    // Fall back to keyword search
    return this.parseSport(normalized);
  }

  private parsePrice(priceText: string): number {
    // Remove currency symbols and parse
    const cleaned = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private parseDate(dateText: string): Date {
    try {
      // Try various date formats
      const formats = ['MM/dd/yyyy', 'yyyy-MM-dd', 'MMM dd, yyyy'];

      for (const fmt of formats) {
        try {
          return parse(dateText.trim(), fmt, new Date());
        } catch {
          continue;
        }
      }
    } catch (error) {
      console.error('Error parsing date:', dateText);
    }

    // Default to tomorrow
    return addDays(new Date(), 1);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
  }

  private generateId(): string {
    return `lsc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mock data for development/testing
  async getMockBreaks(sport: Sport, date: Date): Promise<BreakDetails[]> {
    const mockBreaks: BreakDetails[] = [
      {
        id: 'mock_1',
        sport,
        productName: '2024 Panini Prizm Football Hobby Box',
        breakDate: date,
        price: 89.99,
        spotsAvailable: 15,
        spotsTotal: 30,
        breaker: 'Layton Sports Cards',
        streamUrl: 'https://www.youtube.com/@laytonsportscards',
      },
      {
        id: 'mock_2',
        sport,
        productName: '2024 Topps Chrome Baseball Hobby Case',
        breakDate: date,
        price: 149.99,
        spotsAvailable: 8,
        spotsTotal: 12,
        breaker: 'Layton Sports Cards',
        streamUrl: 'https://www.youtube.com/@laytonsportscards',
      },
      {
        id: 'mock_3',
        sport,
        productName: '2023-24 Panini Prizm Basketball Blaster Box',
        breakDate: date,
        price: 29.99,
        spotsAvailable: 20,
        spotsTotal: 24,
        breaker: 'Layton Sports Cards',
        streamUrl: 'https://www.youtube.com/@laytonsportscards',
      },
    ];

    return mockBreaks.filter(b => b.sport === sport);
  }
}

export const breakScraper = new LaytonBreakScraper();
const parseWhatsAppExport = (text) => {
  const lines = text.split('\n');
  const items = [];
  
  lines.forEach(line => {
    // Handle different WhatsApp export formats
    
    // Format 1: [date time] sender: message (common on Android)
    let match = line.match(/\[(.*?)\] (.*?): (.*)/);
    
    // Format 2: date time - sender: message (common on iOS)
    if (!match) {
      match = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}) - (.*?): (.*)/);
    }
    
    if (match) {
      let dateTime, sender, message;
      
      if (match.length === 4) {
        [, dateTime, sender, message] = match;
      }
      
      // Check if message contains URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message ? message.match(urlRegex) : null;
      
      if (urls && urls.length > 0) {
        urls.forEach(url => {
          items.push({
            type: 'link',
            content: url,
            source: 'whatsapp',
            timestamp: parseWhatsAppDate(dateTime),
            sender: sender
          });
        });
      }
      
      // Also check for media files (if mentioned in export)
      if (message) {
        const mediaRegex = /<attached: (.*?)>|(.*\.(jpg|jpeg|png|gif|mp4|mov|avi))$/gi;
        const mediaMatches = message.match(mediaRegex);
        
        if (mediaMatches) {
          mediaMatches.forEach(media => {
            items.push({
              type: 'image',
              content: media,
              source: 'whatsapp',
              timestamp: parseWhatsAppDate(dateTime),
              sender: sender,
              isMedia: true
            });
          });
        }
      }
    }
  });
  
  return items;
};

// Helper function to parse WhatsApp date formats
const parseWhatsAppDate = (dateTimeStr) => {
  try {
    // Try different date formats used by WhatsApp exports
    let date;
    
    // Format: DD/MM/YY, HH:MM (e.g., "24/08/25, 14:30")
    if (dateTimeStr.includes('/')) {
      const [datePart, timePart] = dateTimeStr.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes] = timePart.split(':');
      
      // Convert 2-digit year to 4-digit
      const fullYear = year.length === 2 ? `20${year}` : year;
      date = new Date(fullYear, month - 1, day, hours, minutes);
    } 
    // Format: [MM/DD/YY, HH:MM:SS AM/PM] (e.g., "[8/24/25, 2:30:45 PM]")
    else if (dateTimeStr.includes('[')) {
      const cleanStr = dateTimeStr.replace('[', '').replace(']', '');
      date = new Date(cleanStr);
    }
    
    return date || new Date();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

module.exports = { parseWhatsAppExport };
export interface TicketData {
  studioName: string;
  clientName: string;
  appointmentId: string;
  date: string;
  time: string;
  services: string[];
  staffName: string;
  branchAddress: string;
}

export const generateTicketHtml = (data: TicketData): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Ticket</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
        body {
          font-family: 'Outfit', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .ticket {
          width: 600px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
        }
        .ticket-left {
          background-color: #0f172a;
          color: white;
          padding: 40px;
          width: 35%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .ticket-right {
          padding: 40px;
          width: 65%;
          position: relative;
        }
        .studio-name {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #38bdf8;
        }
        .date-box {
          margin-bottom: 30px;
        }
        .date-box h2 { margin: 0; font-size: 32px; }
        .date-box p { margin: 0; font-size: 16px; opacity: 0.8; }
        
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 5px 0;
        }
        .subtitle {
          color: #64748b;
          margin: 0 0 30px 0;
        }
        
        .detail-group {
          margin-bottom: 20px;
        }
        .detail-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 600;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }
        .services {
          background: #f8fafc;
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
        }
        .services ul {
          margin: 0;
          padding-left: 20px;
          color: #334155;
        }
        .ticket-id {
          position: absolute;
          top: 40px;
          right: 40px;
          font-family: monospace;
          color: #cbd5e1;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-left">
          <div>
            <div class="studio-name">${data.studioName}</div>
            <div class="date-box">
              <h2>${data.time}</h2>
              <p>${data.date}</p>
            </div>
          </div>
          <div>
            <div style="opacity: 0.5; font-size: 12px;">LOCATION</div>
            <div style="font-size: 14px; margin-top: 5px;">${data.branchAddress}</div>
          </div>
        </div>
        
        <div class="ticket-right">
          <div class="ticket-id">#${data.appointmentId}</div>
          <h1 class="title">Booking Confirmed</h1>
          <p class="subtitle">For ${data.clientName}</p>
          
          <div class="detail-group">
            <div class="detail-label">Stylist / Professional</div>
            <div class="detail-value">${data.staffName}</div>
          </div>
          
          <div class="services">
            <div class="detail-label">Services Booked</div>
            <ul>
              ${data.services.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

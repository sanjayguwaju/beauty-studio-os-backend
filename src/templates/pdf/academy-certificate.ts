export interface CertificateData {
  studioName: string;
  studentName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  certificateId: string;
}

export const generateCertificateHtml = (data: CertificateData): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate of Completion</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          background: #fff;
          font-family: 'Lato', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          box-sizing: border-box;
        }
        
        .certificate-container {
          width: 95%;
          height: 90%;
          border: 15px solid #d4af37; /* Gold border */
          padding: 40px;
          text-align: center;
          position: relative;
          background-color: #faf9f6;
          box-sizing: border-box;
        }
        
        .inner-border {
          border: 2px solid #d4af37;
          height: 100%;
          width: 100%;
          padding: 40px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .studio-header {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 40px;
        }

        .title {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          color: #1a1a1a;
          margin: 0 0 20px 0;
        }
        
        .subtitle {
          font-size: 18px;
          color: #666;
          margin-bottom: 40px;
          font-style: italic;
        }

        .student-name {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 700;
          color: #d4af37;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 10px;
          margin-bottom: 40px;
          width: 60%;
        }

        .course-text {
          font-size: 20px;
          color: #333;
          line-height: 1.6;
          margin-bottom: 60px;
          max-width: 80%;
        }

        .signatures {
          display: flex;
          justify-content: space-between;
          width: 80%;
          margin-top: auto;
        }

        .signature-block {
          text-align: center;
          width: 250px;
        }

        .signature-line {
          border-top: 1px solid #333;
          margin-bottom: 10px;
          padding-top: 5px;
        }

        .cert-id {
          position: absolute;
          bottom: 20px;
          right: 30px;
          font-size: 10px;
          color: #999;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="inner-border">
          <div class="studio-header">${data.studioName} ACADEMY</div>
          
          <h1 class="title">Certificate of Completion</h1>
          <div class="subtitle">This is to proudly certify that</div>
          
          <div class="student-name">${data.studentName}</div>
          
          <div class="course-text">
            has successfully completed all requirements and coursework for the<br>
            <strong>${data.courseName}</strong> program.
          </div>
          
          <div class="signatures">
            <div class="signature-block">
              <div style="font-family: 'Playfair Display', serif; font-size: 24px; font-style: italic; margin-bottom: 5px;">${data.instructorName}</div>
              <div class="signature-line">Lead Instructor</div>
            </div>
            <div class="signature-block">
              <div style="font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 5px;">${data.completionDate}</div>
              <div class="signature-line">Date of Issuance</div>
            </div>
          </div>
          
          <div class="cert-id">ID: ${data.certificateId}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

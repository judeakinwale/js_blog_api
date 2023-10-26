const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME}, <${process.env.FROM_EMAIL}>`, // sender address
    to: options.email,
    cc: options.cc,
    subject: options.subject,
    text: options.message,
    html: `
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media screen and (max-width: 992px) {
      table{width: 500px;}
      table h2{padding-bottom: 15px !important; margin-top: 15px !important;}
      h2 img{padding-bottom: 15px !important; margin-top: 15px !important;}
      .tableData{padding: 2rem !important;}
      .tableData img{padding-bottom: 15px !important;}
      .tableData h1{padding-bottom: 15px !important; font-size: 24px !important;}
      .tableData p{padding-bottom: 15px !important;}
      button{padding: 1rem 2rem !important; font-size: 14px !important;}
    }
    @media screen and (max-width: 768px) {
      table{width: 450px;}
      table h2{padding-bottom: 15px !important; margin-top: 15px !important;}
      h2 img{padding-bottom: 15px !important; margin-top: 15px !important;}
      .tableData{padding: 2rem !important;}
      .tableData img{padding-bottom: 15px !important;}
      .tableData h1{padding-bottom: 15px !important; font-size: 20px !important;}
      .tableData p{padding-bottom: 15px !important; font-size: 12px !important;}
      button{padding: 1rem 2rem !important; font-size: 14px !important;}
    }
    @media screen and (max-width: 562px) {
      table{width: 100%;}
      table h2{padding-bottom: 15px !important; margin-top: 15px !important;}
      h2 img{padding-bottom: 15px !important; margin-top: 15px !important;}
      .tableData{padding: 1rem !important;}
      .tableData img{padding-bottom: 15px !important;}
      .tableData h1{padding-bottom: 15px !important; font-size: 16px !important;}
      .tableData p{padding-bottom: 15px !important; font-size: 10px !important;}
      button{padding: 0.7rem !important; font-size: 12px !important;}
    }
  </style>
  <title>Company Name</title>
</head>
<body bgcolor="#D6D6D5" style="display: flex;align-items: center;justify-content: center; height: 100vh;">
  <!-- Main table -->
  <table border="0" align="center" cellspacing="0" cellpadding="0" bgcolor="white" width="650">
    <tr>
      <td>
        <!-- Child table -->
        <table border="0" cellspacing="0" cellpadding="0" style="color:#0f3462; font-family: sans-serif;">
          <tr style="background-color: #0D244D;">
            <td>
              <h2 style="display: flex; align-items: center;justify-content: center; margin: 0px; padding-bottom: 25px; margin-top: 25px;">
                <img src="../src/assets/emailPic.png" style="padding-bottom: 25px; ">
              </h2>
            </td>
          </tr>
          <tr style="background-color: white; min-height: 100px;">
            <td style="text-align: center; padding: 3rem" class="tableData">
              <img src="../src/assets/accountVer.png" style="padding-bottom: 25px; ">
              ${options.content}
             
            </td>
          </tr>
        </table>
      
      </td>
    </tr>
  </table>
</body>

</html>
    
    `,
  };
  const info = await transporter.sendMail(message);
  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;

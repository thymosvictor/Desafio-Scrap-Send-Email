//Projeto Scraping e Send Email
// Aluno: Thymos Victor

const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Define a cotação da libra para real
const COTACAO_LIBRA = 6.5;

// Função para fazer o scraping
async function scrapeBooks() {
  const url = "https://books.toscrape.com/";

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const books = [];

    $(".product_pod").each((index, element) => {
      const title = $(element).find("h3 a").attr("title");
      const priceText = $(element).find(".price_color").text(); // ex: £51.77
      const priceLibra = parseFloat(priceText.replace("£", ""));

      // Conversão para real
      const priceReal = (priceLibra * COTACAO_LIBRA).toFixed(2);

      books.push({
        title,
        priceLibra: `£${priceLibra}`,
        priceReal: `R$${priceReal}`,
      });
    });

    console.log("📚 Livros capturados:\n");
    books.forEach((book) => {
      console.log(
        `📖 ${book.title} - 💰 ${book.priceLibra} (~${book.priceReal})`
      );
    });

    return books;
  } catch (error) {
    console.error("❌ Erro no scraping:", error.message);
    return [];
  }
}

// Função para enviar email
async function sendEmail(content) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Scraper de Livros" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: "📚 Livros atualizados com preço em reais",
    text: `Olá, aqui estão os livros mais recentes coletados, com preços convertidos para reais:\n\n${content}\n\nAtenciosamente, seu scraper.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado com sucesso:", info.response);
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error.message);
  }
}

// Função principal
(async () => {
  const books = await scrapeBooks();

  if (books.length === 0) {
    console.log("Nenhum livro encontrado.");
    return;
  }

  const emailContent = books
    .map(
      (book) => `📖 ${book.title} - 💰 ${book.priceLibra} (~${book.priceReal})`
    )
    .join("\n");

  await sendEmail(emailContent);
})();

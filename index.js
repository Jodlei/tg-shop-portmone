const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const axios = require("axios");
const fs = require("fs");

const SHOP_LIVE_LIST = [
  {
    id: 1,
    title: "Панна кота",
    description: "Манго/полуниця/чіа пудинг манго/полуниця тірамісу",
    payload: {
      title: "Панна кота",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 100,
    photo_url: "https://chudo-povar.com/images/panakota.jpg",
    need_name: true,
    need_phone_number: true,
    need_email: true,
    need_shipping_address: true,
    send_phone_number_to_provider: true,
    send_email_to_provider: true,
  },

  {
    id: 2,
    title: "Круасан з лососем",
    description:
      "Круасан з лососем та авокадо, салатом айсберг, шпинатом, медово-гірчичним соусом та крем-сиром",
    payload: {
      title: "Круасан з лососем",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 500,
    photo_url:
      "https://goodchef.com.ua/irpin/image/cache/catalog/products/croissant/kruasanslosose-700x700.png",
    need_name: false,
    need_phone_number: true,
    need_email: true,
    need_shipping_address: true,
    send_phone_number_to_provider: true,
    send_email_to_provider: true,
  },

  {
    id: 3,
    title: "Чорний ліс",
    description:
      "Шоколадний хрусткий штройзель, шоколадний бісквіт, шоколадний прошарок, шоколадне кремю, вишневе компоте з лікером Єгермейстер, ванільний мус на основі білого шоколаду",
    payload: {
      title: "Чорний ліс",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 500,
    photo_url: "https://i.ytimg.com/vi/tMyfG6Cr4Vs/maxresdefault.jpg",
    need_name: true,
    need_phone_number: false,
    need_email: true,
    need_shipping_address: true,
    send_phone_number_to_provider: false,
    send_email_to_provider: true,
  },

  {
    id: 4,
    title: "Естерхазі",
    description:
      "Мигдалеві коржі, шоколодно-горіхове праліне, карамельний ганаш, грецький горіх, крем на основі згущеного молока",
    payload: {
      title: "Естерхазі",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 500,
    photo_url:
      "https://lukas-sweet.shop/image/cache/catalog/tovari/tort/-%D0%BB%D1%83%D0%BA%D0%B0%D1%81-1000x1000.jpg",
    need_name: true,
    need_phone_number: true,
    need_email: false,
    need_shipping_address: true,
    send_phone_number_to_provider: true,
    send_email_to_provider: false,
  },

  {
    id: 5,
    title: "Чізкейк карамельний",
    description:
      "Пісочна основа, сир Філадельфія, сир Маскарпоне, карамель власного приготування",
    payload: {
      title: "Чізкейк карамельний",
      billNumber: `${Math.floor(
        Math.random() * 1000
      )},"description": "Пісочна основа, сир Філадельфія, сир Маскарпоне, карамель власного приготування"`,
    },
    price: 500,
    photo_url: "https://i.ytimg.com/vi/krbt9WinBzw/maxresdefault.jpg",
    need_name: true,
    need_phone_number: true,
    need_email: true,
    need_shipping_address: false,
    send_phone_number_to_provider: true,
    send_email_to_provider: true,
  },
];

const START_SHOP_TEXT_LIVE = "Привітання";

dotenv.config();

const bot = new TelegramBot(process.env.SHOP_TOKEN_LIVE || "", {
  polling: false,
});

let update_data = {};
let update_id = 0;
let language = "uk";

const sendInvoice = async (body) => {
  const data = {
    title: body.title,
    description: body.description,
    payload: JSON.stringify(body.payload),
    prices: [{ label: body.title, amount: body.amount }],
    chat_id: body.chat_id,
    provider_token: body.provider_token,
    currency: "UAH",
    photo_url: body.photo_url,
    photo_height: 400,
    photo_width: 400,
    need_name: body.need_name,
    need_phone_number: body.need_phone_number,
    need_email: body.need_email,
    need_shipping_address: body.need_shipping_address,
    send_phone_number_to_provider: body.send_phone_number_to_provider,
    send_email_to_provider: body.send_email_to_provider,
  };

  const endpoint = `https://api.telegram.org/bot${body.token}/sendInvoice`;

  try {
    return await axios.post(endpoint, data);
  } catch (error) {
    console.error("sendInvoice error:", error);
  }
};

const answerPreCheckoutQuery = async (token, pre_checkout_query_id, status) => {
  console.log("answerPreCheckoutQuerySTATUS", status);
  let statusParam = "ok=True";
  if (status && status === "REJECTED") {
    statusParam =
      "ok=False&error_message=Something went wrong. Please, check your payment";
  }
  console.log(
    "queryAswerPCQ",
    `https://api.telegram.org/bot${token}/answerPreCheckoutQuery?pre_checkout_query_id=${pre_checkout_query_id}&${statusParam}`
  );
  try {
    return await axios.get(
      `https://api.telegram.org/bot${token}/answerPreCheckoutQuery?pre_checkout_query_id=${pre_checkout_query_id}&${statusParam}`
    );
  } catch (error) {
    console.error("answerPreCheckoutQuery error:", error);
  }
};

const log = (label, message, category) => {
  const timeStamp = () => {
    return new Date().toISOString();
  };

  const logEntry = `{"time":"${timeStamp()}","level":"${category}","instance":"${label}","info":${JSON.stringify(
    message
  )}}\n`;

  fs.appendFile(process.env.LOG_PATH, logEntry, (err) => {
    if (err) {
      console.error("Помилка запису файлу:", err);
    }
  });
};

const getUpdates = async () => {
  try {
    const updates = await bot.getUpdates({ offset: update_id + 1 });
    for (const update of updates) {
      update_id = update.update_id;
    }
    if (updates.length) {
      update_data = updates[0];
      console.log(update_data);
      log("TG_SHOP_LIVE", update_data, "INFO");
      // обробка pre_checkout_query
      if (update_data.pre_checkout_query) {
        const pre_checkout_id = update_data.pre_checkout_query.id;
        if (pre_checkout_id) {
          language = update_data.pre_checkout_query.from.language_code;
          await answerPreCheckoutQuery(
            process.env.SHOP_TOKEN_LIVE,
            pre_checkout_id
          );
        }
      }
      // обробка команди /start
      if (update_data.message?.text === "/start") {
        await bot.sendMessage(
          update_data.message.chat.id,
          START_SHOP_TEXT_LIVE
        );
      }
      // обробка команди /list
      if (update_data.message?.text === "/list") {
        const shopList = JSON.parse(SHOP_LIVE_LIST || "[]");
        for (const item of shopList) {
          const body = {
            title: item.title,
            description: item.description,
            amount: item.price,
            token: process.env.SHOP_TOKEN_LIVE,
            payeeId: process.env.TEST_PAYEE_ID,
            chat_id: update_data.message.chat.id,
            provider_token: process.env.SHOP_PROVIDER_TOKEN_LIVE,
            photo_url: item.photo_url,
            need_name: item.need_name,
            need_phone_number: item.need_phone_number,
            need_email: item.need_email,
            need_shipping_address: item.need_shipping_address,
            send_phone_number_to_provider: item.send_phone_number_to_provider,
            send_email_to_provider: item.send_email_to_provider,
            payload: item.payload,
          };
          await sendInvoice(body);
        }
      }
    }
    setTimeout(getUpdates, 1000);
  } catch (error) {
    log("TG_SHOP_LIVE", `Something went wrong: ${error}`, "ERROR");
  }
};

getUpdates();

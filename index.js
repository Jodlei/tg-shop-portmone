const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const axios = require("axios");
const fs = require("fs");
const express = require("express");

const SHOP_LIVE_LIST = [
  {
    id: 1,
    title: "Ноутбук Apple MacBook Air 13 M1 8/256GB",
    description:
      "Екран 13.3 Retina (2560x1600) WQXGA, глянсовий / Apple M1 / RAM 8 ГБ / SSD 256 ГБ / Apple M1 Graphics / Wi-Fi / Bluetooth / macOS Big Sur / 1.29 кг / сірий",
    payload: {
      title: "Ноутбук Apple MacBook Air 13 M1 8/256GB",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 100,
    photo_url: "https://content1.rozetka.com.ua/goods/images/big/144249716.jpg",
    need_name: true,
    need_phone_number: true,
    need_email: true,
    need_shipping_address: true,
    send_phone_number_to_provider: true,
    send_email_to_provider: true,
  },

  {
    id: 2,
    title: "Ноутбук Apple MacBook Pro 16 M1 Pro",
    description:
      "Екран 16.2 Liquid Retina XDR (3456x2234) 120 Гц, глянсовий / Apple M1 Pro / RAM 32 ГБ / SSD 1 ТБ / Apple M1 Pro Graphics (16 ядер) / без ОД / Wi-Fi / Bluetooth / веб-камера / macOS Monterey / 2.1 кг / сірий",
    payload: {
      title: "Ноутбук Apple MacBook Pro 16 M1 Pro",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 500,
    photo_url: "https://content2.rozetka.com.ua/goods/images/big/439131252.jpg",
    need_name: false,
    need_phone_number: true,
    need_email: true,
    need_shipping_address: true,
    send_phone_number_to_provider: true,
    send_email_to_provider: true,
  },

  {
    id: 3,
    title: "Ноутбук Apple MacBook Air 13.6 M2",
    description:
      "Екран 13.6 Liquid Retina (2560x1664), глянсовий / Apple M2 / RAM 8 ГБ / SSD 256 ГБ / Apple M2 Graphics (8 ядер) / Wi-Fi / Bluetooth / macOS Monterey / 1.24 кг / сірий",
    payload: {
      title: "Ноутбук Apple MacBook Air 13.6 M2",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 500,
    photo_url: "https://content2.rozetka.com.ua/goods/images/big/269256825.jpg",
    need_name: true,
    need_phone_number: false,
    need_email: true,
    need_shipping_address: true,
    send_phone_number_to_provider: false,
    send_email_to_provider: true,
  },

  {
    id: 4,
    title: "Ноутбук Apple MacBook Pro 16 M3 Pro",
    description:
      "Екран 16.2 Liquid Retina XDR (3456x2234) 120 Гц, глянсовий / Apple M3 Pro / RAM 36 ГБ / SSD 512 ГБ / Apple M3 Graphics (18 ядер) / без ОД / Wi-Fi / Bluetooth / веб-камера / macOS Sonoma / 2.14 кг / срібний",
    payload: {
      title: "Ноутбук Apple MacBook Pro 16 M3 Pro",
      billNumber: `${Math.floor(Math.random() * 1000)}`,
    },
    price: 500,
    photo_url: "https://content2.rozetka.com.ua/goods/images/big/377405278.jpg",
    need_name: true,
    need_phone_number: true,
    need_email: false,
    need_shipping_address: true,
    send_phone_number_to_provider: true,
    send_email_to_provider: false,
  },
];

const START_SHOP_TEXT_LIVE = "Привітання 1";

// const express = require("express");
// const app = express();
// const port = process.env.PORT || 4000;

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });
const app = express();
app.use(express.json());
app.listen(process.env.PORT, () =>
  console.log("server started on PORT " + PORT)
);

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
    prices: `[{"label": "${body.title}", "amount": "${body.amount}"}]`,
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

  const endpoint = `https://api.telegram.org/bot${
    body.token
  }/sendInvoice?${new URLSearchParams(data).toString()}`;

  try {
    return await axios.post(endpoint, data);
  } catch (error) {
    console.error("sendInvoice error:", error);
  }
};

const answerPreCheckoutQuery = async (token, pre_checkout_query_id, status) => {
  // console.log("answerPreCheckoutQuerySTATUS", status);
  let statusParam = "ok=True";
  if (status && status === "REJECTED") {
    statusParam =
      "ok=False&error_message=Something went wrong. Please, check your payment";
  }
  // console.log(
  //   "queryAswerPCQ",
  //   `https://api.telegram.org/bot${token}/answerPreCheckoutQuery?pre_checkout_query_id=${pre_checkout_query_id}&${statusParam}`
  // );
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
      // console.log(update_data);
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
        for (const item of SHOP_LIVE_LIST) {
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

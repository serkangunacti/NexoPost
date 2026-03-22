"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, Type, Clock, Loader2, Wand2, ImagePlus, X, ChevronDown, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import { getSubscriptionSnapshot } from "@/lib/subscription";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

// ── Emoji Data (Unicode 15.1) ─────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    id: "smileys", label: "😀", name: "Smileys & Emotion",
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😶‍🌫️","😏","😒","🙄","😬","😮‍💨","🤥","🫨","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","😵‍💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","💋","💌","💘","💝","💖","💗","💓","💞","💕","💟","❣️","💔","❤️","🩷","🧡","💛","💚","💙","🩵","💜","🖤","🩶","🤍","🤎","❤️‍🔥","❤️‍🩹","💯","💢","💥","💫","💦","💨","🕳️","💬","🗨️","🗯️","💭","💤"],
  },
  {
    id: "people", label: "🧑", name: "People & Body",
    emojis: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","🫷","🫸","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁️","👅","👄","🫦","👶","🧒","👦","👧","🧑","👱","👨","🧔","🧔‍♂️","🧔‍♀️","👩","🧑‍🦰","👨‍🦰","👩‍🦰","🧑‍🦱","👨‍🦱","👩‍🦱","🧑‍🦳","👨‍🦳","👩‍🦳","🧑‍🦲","👨‍🦲","👩‍🦲","🧓","👴","👵","🙍","🙍‍♂️","🙍‍♀️","🙎","🙎‍♂️","🙎‍♀️","🙅","🙅‍♂️","🙅‍♀️","🙆","🙆‍♂️","🙆‍♀️","💁","💁‍♂️","💁‍♀️","🙋","🙋‍♂️","🙋‍♀️","🧏","🧏‍♂️","🧏‍♀️","🙇","🙇‍♂️","🙇‍♀️","🤦","🤦‍♂️","🤦‍♀️","🤷","🤷‍♂️","🤷‍♀️","👮","👮‍♂️","👮‍♀️","🕵️","🕵️‍♂️","🕵️‍♀️","💂","💂‍♂️","💂‍♀️","🥷","👷","👷‍♂️","👷‍♀️","🫅","🤴","👸","👰","👰‍♂️","👰‍♀️","🤵","🤵‍♂️","🤵‍♀️","🧙","🧙‍♂️","🧙‍♀️","🧚","🧚‍♂️","🧚‍♀️","🧛","🧛‍♂️","🧛‍♀️","🧜","🧜‍♂️","🧜‍♀️","🧝","🧝‍♂️","🧝‍♀️","🧞","🧞‍♂️","🧞‍♀️","🧟","🧟‍♂️","🧟‍♀️","🧌","💆","💆‍♂️","💆‍♀️","💇","💇‍♂️","💇‍♀️","🚶","🚶‍♂️","🚶‍♀️","🧍","🧍‍♂️","🧍‍♀️","🧎","🧎‍♂️","🧎‍♀️","🏃","🏃‍♂️","🏃‍♀️","💃","🕺","🕴️","👯","👯‍♂️","👯‍♀️","🧖","🧖‍♂️","🧖‍♀️","🧗","🧗‍♂️","🧗‍♀️","🤺","🏇","⛷️","🏂","🪂","🏋️","🏋️‍♂️","🏋️‍♀️","🤼","🤼‍♂️","🤼‍♀️","🤸","🤸‍♂️","🤸‍♀️","⛹️","⛹️‍♂️","⛹️‍♀️","🤾","🤾‍♂️","🤾‍♀️","🏌️","🏌️‍♂️","🏌️‍♀️","🏄","🏄‍♂️","🏄‍♀️","🚣","🚣‍♂️","🚣‍♀️","🧘","🧘‍♂️","🧘‍♀️","🛀","🛌","👭","👫","👬","💏","💑","👨‍👩‍👦","👨‍👩‍👧","👨‍👩‍👧‍👦","👨‍👩‍👦‍👦","👨‍👩‍👧‍👧","👨‍👦","👨‍👧","👩‍👦","👩‍👧","👓","🕶️","🥽","👔","👕","👖","🧣","🧤","🧥","🧦","👗","👘","🥻","🩱","🩲","🩳","👙","👛","👜","👝","🎒","🧳","👒","🎩","🧢","⛑️","💄","💍","💎","👑"],
  },
  {
    id: "animals", label: "🐶", name: "Animals & Nature",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🫏","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪲","🦟","🦗","🪳","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🪸","🦪","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🪼","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🫎","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁","🪺","🪹","🍄","🐚","🪸","🪨","🌾","💐","🌷","🌹","🥀","🪻","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌟","⭐","🌠","🌌","☀️","🌤️","⛅","🌥️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","💨","💧","💦","🫧","☔","☂️","🌊","🌀","🌈","⚡","🔥","🌫️","🌁","🌡️","☄️","🌪️","🌏","🪐","⭐","🌟","✨"],
  },
  {
    id: "food", label: "🍔", name: "Food & Drink",
    emojis: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🫒","🥑","🍆","🥔","🍠","🫚","🧅","🧄","🌽","🌶️","🫑","🥒","🥬","🥦","🧆","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫔","🌮","🌯","🥙","🥚","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🫕","🍲","🥘","🍛","🍜","🍝","🍣","🍱","🥟","🦪","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🥜","🍯","🧃","🥤","🧋","☕","🫖","🍵","🧉","🍺","🍻","🥂","🍷","🫗","🥃","🍸","🍹","🍾","🧊","🥛","🫙","🧂","💧","🌊","🍶","🥤","🫗","🧃","🥛","☕","🍵","🫖"],
  },
  {
    id: "travel", label: "✈️", name: "Travel & Places",
    emojis: ["🌍","🌎","🌏","🌐","🗺️","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱","🪨","🪵","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🌄","🌅","🌆","🌇","🌉","🌌","🎠","🎡","🎢","💈","🎪","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","🏎️","🏍️","🛵","🛺","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","🛞","⛽","🚨","🚦","🚥","🛑","🚧","⚓","🛟","⛵","🛶","🚤","🛳️","⛴️","🛥️","🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🪐","🌠","⛱️","🎆","🎇","🗿","🏧","🚾","♿","🅿️","🛗","🚩","🎌","🏁","🏳️"],
  },
  {
    id: "activities", label: "⚽", name: "Activities & Sports",
    emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛷","⛸️","🏂","🪂","🏋️","🏋️‍♂️","🏋️‍♀️","🤼","🤸","⛹️","🤾","🏌️","🏄","🚣","🧘","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎭","🎨","🖼️","🎰","🎲","♟️","🎯","🎳","🎮","🕹️","🧩","🪄","🎪","🤹","🎤","🎧","🎼","🎵","🎶","🎷","🎸","🎹","🎺","🎻","🪕","🥁","🪘","🎙️","📻","🎚️","🎛️","🎁","🎀","🎊","🎉","🎈","🎆","🎇","🧨","🎃","🎄","🎋","🎍","🎑","🎎","🎏","🎐","🧧","🥳","🪅","🪆","🎠","🎡","🎢"],
  },
  {
    id: "objects", label: "💡", name: "Objects",
    emojis: ["⌚","📱","📲","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💾","💿","📀","🧮","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🪫","🔌","💡","🔦","🕯️","🪔","🧱","🪟","🚪","🛋️","🪑","🚽","🪠","🚿","🛁","🪤","🪒","🧴","🧷","🧹","🧺","🧻","🪣","🧼","🫧","🪥","🧽","🧯","🛒","🧲","🪜","🪞","🛏️","⚗️","🧪","🧫","🧬","🔬","🔭","🩺","🩻","🩹","💊","🩼","🩸","💉","🔨","🪓","⛏️","⚒️","🛠️","🗡️","⚔️","🛡️","🪚","🔧","🪛","🔩","⚙️","🗜️","⚖️","🦯","🔗","⛓️","🪝","🪜","✏️","✒️","🖊️","🖋️","📝","📓","📔","📒","📕","📗","📘","📙","📚","📖","🔖","🏷️","📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️","📁","📂","🗂️","📋","📅","📆","🗒️","🗓️","📇","✉️","📧","📨","📩","📤","📥","📦","📫","📪","📬","📭","📮","🗳️","💰","🪙","💴","💵","💶","💷","💸","💳","🧾","💹","📈","📉","📊","🔍","🔎","🔒","🔓","🔏","🔐","🔑","🗝️","🧸","🪆","🪅","🪢","🧿","🧶","🧵","🪡","🎀","🎁","🎊","🎉","🎈","🔮","📿","💈","🪬","🗿"],
  },
  {
    id: "symbols", label: "🔣", name: "Symbols & Signs",
    emojis: ["❤️","🧡","💛","💚","💙","🩵","💜","🖤","🩶","🤍","🤎","❤️‍🔥","❤️‍🩹","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","⬆️","↗️","➡️","↘️","⬇️","↙️","⬅️","↖️","↕️","↔️","↩️","↪️","⤴️","⤵️","🔃","🔄","🔙","🔚","🔛","🔜","🔝","🛐","⚛️","🕉️","✝️","☦️","☪️","☮️","🔯","✡️","🔱","⚜️","🕎","☯️","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⚠️","🚸","⛔","🚫","🚳","🚭","🚯","🚱","🚷","📵","🔞","☢️","☣️","✅","❌","❓","❔","❗","❕","‼️","⁉️","💯","🔅","🔆","〽️","🔱","⚜️","🔰","♻️","✅","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🆕","🆙","🆓","🆒","🆗","🆖","🅰️","🅱️","🆎","🅾️","🆘","🆔","🔤","🔡","🔢","🔣","🔠","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔷","🔶","🔹","🔸","🔲","🔳","▪️","▫️","◾","◽","◼️","◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫","🔈","🔉","🔊","🔇","📣","📢","🔔","🔕","♨️","✖️","➕","➖","➗","🟰","♾️","💲","💱","™️","©️","®️","〰️","➰","➿","♀️","♂️","⚧️","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛","🕜","🕝","🕞","🕟","🕠","🕡","🕢","🕣","🕤","🕥","🕦","🕧"],
  },
  {
    id: "flags", label: "🏳️", name: "Flags",
    emojis: ["🏳️","🏴","🚩","🎌","🏁","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️","🇦🇫","🇦🇱","🇩🇿","🇦🇩","🇦🇴","🇦🇬","🇦🇷","🇦🇲","🇦🇺","🇦🇹","🇦🇿","🇧🇸","🇧🇭","🇧🇩","🇧🇧","🇧🇾","🇧🇪","🇧🇿","🇧🇯","🇧🇹","🇧🇴","🇧🇦","🇧🇼","🇧🇷","🇧🇳","🇧🇬","🇧🇫","🇧🇮","🇨🇻","🇰🇭","🇨🇲","🇨🇦","🇨🇫","🇹🇩","🇨🇱","🇨🇳","🇨🇴","🇰🇲","🇨🇩","🇨🇬","🇨🇷","🇨🇮","🇭🇷","🇨🇺","🇨🇾","🇨🇿","🇩🇰","🇩🇯","🇩🇲","🇩🇴","🇪🇨","🇪🇬","🇸🇻","🇬🇶","🇪🇷","🇪🇪","🇸🇿","🇪🇹","🇫🇯","🇫🇮","🇫🇷","🇬🇦","🇬🇲","🇬🇪","🇩🇪","🇬🇭","🇬🇷","🇬🇩","🇬🇹","🇬🇳","🇬🇼","🇬🇾","🇭🇹","🇭🇳","🇭🇺","🇮🇸","🇮🇳","🇮🇩","🇮🇷","🇮🇶","🇮🇪","🇮🇱","🇮🇹","🇯🇲","🇯🇵","🇯🇴","🇰🇿","🇰🇪","🇰🇮","🇰🇵","🇰🇷","🇰🇼","🇰🇬","🇱🇦","🇱🇻","🇱🇧","🇱🇸","🇱🇷","🇱🇾","🇱🇮","🇱🇹","🇱🇺","🇲🇬","🇲🇼","🇲🇾","🇲🇻","🇲🇱","🇲🇹","🇲🇭","🇲🇷","🇲🇺","🇲🇽","🇫🇲","🇲🇩","🇲🇨","🇲🇳","🇲🇪","🇲🇦","🇲🇿","🇲🇲","🇳🇦","🇳🇷","🇳🇵","🇳🇱","🇳🇿","🇳🇮","🇳🇪","🇳🇬","🇲🇰","🇳🇴","🇴🇲","🇵🇰","🇵🇼","🇵🇸","🇵🇦","🇵🇬","🇵🇾","🇵🇪","🇵🇭","🇵🇱","🇵🇹","🇶🇦","🇷🇴","🇷🇺","🇷🇼","🇰🇳","🇱🇨","🇻🇨","🇼🇸","🇸🇲","🇸🇹","🇸🇦","🇸🇳","🇷🇸","🇸🇨","🇸🇱","🇸🇬","🇸🇰","🇸🇮","🇸🇧","🇸🇴","🇿🇦","🇸🇸","🇪🇸","🇱🇰","🇸🇩","🇸🇷","🇸🇪","🇨🇭","🇸🇾","🇹🇼","🇹🇯","🇹🇿","🇹🇭","🇹🇱","🇹🇬","🇹🇴","🇹🇹","🇹🇳","🇹🇷","🇹🇲","🇺🇬","🇺🇦","🇦🇪","🇬🇧","🇺🇸","🇺🇾","🇺🇿","🇻🇺","🇻🇦","🇻🇪","🇻🇳","🇾🇪","🇿🇲","🇿🇼","🇪🇺","🇺🇳"],
  },
];

// Hashtag / mention text rendering
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderHighlightedText(text: string): string {
  const regex = /((?<!\w)#[\w\u0080-\uFFFF]+|(?<!\w)@[\w.]+)/g;
  const parts: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(escapeHtml(text.slice(last, m.index)));
    const isHashtag = m[0].startsWith("#");
    parts.push(
      `<span style="color:${isHashtag ? "#a78bfa" : "#60a5fa"};font-weight:700">${escapeHtml(m[0])}</span>`
    );
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(escapeHtml(text.slice(last)));
  // trailing space so last newline renders in div
  return parts.join("") + " ";
}

const MAX_MEDIA = 10;
const RECENT_STORAGE_KEY = "nexopost_recent_emojis";

export default function ComposePage() {
  const { subscription, activeClient } = useApp();
  const [text, setText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Media
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const subscriptionSnapshot = getSubscriptionSnapshot(subscription);

  // Load recent emojis from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentEmojis(parsed);
        if (parsed.length > 0) setActiveEmojiCategory("recent");
        else setActiveEmojiCategory("smileys");
      } else {
        setActiveEmojiCategory("smileys");
      }
    } catch {
      setActiveEmojiCategory("smileys");
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const platforms = [
    { id: "twitter", name: "Twitter", icon: <SiX className="w-6 h-6" />, color: "hover:bg-neutral-800 bg-neutral-900 border border-neutral-700", activeColor: "bg-black ring-2 ring-white text-white" },
    { id: "linkedin", name: "LinkedIn", icon: <FaLinkedin className="w-6 h-6" />, color: "hover:bg-[#0A66C2]/80 bg-[#0A66C2]/40 text-white/70", activeColor: "bg-[#0A66C2] ring-2 ring-white text-white" },
    { id: "facebook", name: "Facebook", icon: <SiFacebook className="w-6 h-6" />, color: "hover:bg-[#1877F2]/80 bg-[#1877F2]/40 text-white/70", activeColor: "bg-[#1877F2] ring-2 ring-white text-white" },
    { id: "instagram", name: "Instagram", icon: <SiInstagram className="w-6 h-6" />, color: "hover:bg-gradient-to-tr hover:from-[#FD1D1D]/80 hover:to-[#833AB4]/80 bg-gradient-to-tr from-[#FD1D1D]/40 to-[#833AB4]/40 text-white/70", activeColor: "bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4] ring-2 ring-white text-white" },
    { id: "tiktok", name: "TikTok", icon: <SiTiktok className="w-6 h-6 drop-shadow-[1px_1px_0_#fe0979]" />, color: "hover:bg-[#000000]/80 bg-[#000000]/40 border border-[#fe0979]/30 text-[#00f2fe]/70", activeColor: "bg-black ring-2 ring-[#00f2fe] text-[#00f2fe] shadow-[0_0_15px_#fe0979]" },
    { id: "threads", name: "Threads", icon: <SiThreads className="w-6 h-6" />, color: "hover:bg-neutral-800 bg-neutral-900 border border-neutral-800 text-white/70", activeColor: "bg-black ring-2 ring-white text-white" },
    { id: "bluesky", name: "Bluesky", icon: <SiBluesky className="w-6 h-6" />, color: "hover:bg-[#0560FF]/80 bg-[#0560FF]/40 text-white/70", activeColor: "bg-[#0560FF] ring-2 ring-white text-white" },
    { id: "pinterest", name: "Pinterest", icon: <SiPinterest className="w-6 h-6" />, color: "hover:bg-[#E60023]/80 bg-[#E60023]/40 text-white/70", activeColor: "bg-[#E60023] ring-2 ring-white text-white" },
    { id: "youtube_shorts", name: "YouTube Shorts", icon: <SiYoutube className="w-6 h-6" />, color: "hover:bg-[#FF0000]/80 bg-[#FF0000]/40 text-white/70", activeColor: "bg-[#FF0000] ring-2 ring-white text-white shadow-[0_0_15px_#FF0000]" },
  ];

  const handleToggle = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Sync textarea scroll → highlight layer
  const handleTextareaScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Insert emoji at cursor, update recents
  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? text.length;
    const end = ta?.selectionEnd ?? text.length;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setTimeout(() => {
      if (ta) { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }
    }, 0);
    // Update recents
    setRecentEmojis(prev => {
      const next = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 40);
      try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Media file handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (mediaFiles.length >= MAX_MEDIA) {
      showToast(`Maksimum ${MAX_MEDIA} dosya ekleyebilirsiniz. Mevcut limitinize ulaştınız.`);
      e.target.value = "";
      return;
    }
    const remaining = MAX_MEDIA - mediaFiles.length;
    const toAdd = files.slice(0, remaining);
    const overflow = files.length - toAdd.length;
    const newFiles = [...mediaFiles, ...toAdd];
    setMediaFiles(newFiles);
    setMediaPreviews(newFiles.map((f, i) => i < mediaFiles.length ? mediaPreviews[i] : URL.createObjectURL(f)));
    if (overflow > 0) {
      showToast(`${overflow} dosya eklenmedi — maksimum ${MAX_MEDIA} dosya sınırına ulaşıldı.`);
    }
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Drag-and-drop reordering
  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragOverIndex !== i) setDragOverIndex(i);
  };
  const handleDrop = (i: number) => {
    if (dragIndex === null || dragIndex === i) {
      setDragIndex(null); setDragOverIndex(null); return;
    }
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviews];
    const [mf] = newFiles.splice(dragIndex, 1);
    const [mp] = newPreviews.splice(dragIndex, 1);
    newFiles.splice(i, 0, mf);
    newPreviews.splice(i, 0, mp);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
    setDragIndex(null); setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const handleSavePost = async (status: "Scheduled" | "Published" | "Draft") => {
    if (!text.trim() || selectedPlatforms.length === 0) return;
    if ((status === "Scheduled" || status === "Published") && !subscriptionSnapshot.canPublish) {
      alert("Your package has expired. Renew your subscription to schedule or publish new posts.");
      return;
    }
    if (!db) { alert("Firebase configuration is missing."); return; }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "posts"), {
        content: text,
        platforms: selectedPlatforms,
        status,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        autoOptimize,
      });
      setText(""); setMediaFiles([]); setMediaPreviews([]);
      alert(status === "Published" ? "Post published successfully!" : "Post saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Error saving post to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build category list with "Recent" first
  const recentCategory = { id: "recent", label: "🕐", name: "Recently Used", emojis: recentEmojis };
  const allCategories = recentEmojis.length > 0
    ? [recentCategory, ...EMOJI_CATEGORIES]
    : EMOJI_CATEGORIES;
  const activeCategory = allCategories.find(c => c.id === activeEmojiCategory) ?? allCategories[0];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-[#1a1209] border border-amber-500/50 text-amber-200 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/60 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 max-w-sm text-center">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          {toast}
        </div>
      )}

      <header className="mb-8 pr-4">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Active Client</p>
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{activeClient.name || "No Client Selected"}</h1>
        <p className="text-neutral-400 text-lg font-medium">Write once, publish everywhere. Select your platforms and start typing.</p>
        {!subscriptionSnapshot.canPublish && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
            Your package is expired. You can still draft content, but scheduling and publishing are locked until renewal.
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Platform Selection */}
          <div className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-5">1. Select Destination</h3>
            <div className="flex gap-4 relative z-10 flex-wrap">
              {platforms.map(p => {
                const isActive = selectedPlatforms.includes(p.id);
                return (
                  <button key={p.id} title={p.name} onClick={() => handleToggle(p.id)}
                    className={`w-14 h-14 rounded-[1rem] flex items-center justify-center font-bold transition-all duration-300 transform ${isActive ? p.activeColor + " scale-105 shadow-lg shadow-white/10" : p.color + " opacity-60 hover:opacity-100 hover:scale-105"}`}>
                    {p.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor */}
          <div className="glass rounded-[2rem] border border-white/5 overflow-visible flex flex-col min-h-[420px] shadow-2xl relative transition-all duration-500 hover:border-violet-500/20">

            {/* Toolbar */}
            <div className="p-3 border-b border-white/5 flex items-center gap-1 bg-black/20 rounded-t-[2rem]">
              <button title="Format" className="p-2.5 hover:bg-white/10 rounded-xl text-neutral-500 hover:text-white transition-colors">
                <Type className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Media Upload */}
              <button
                title={`Add photo or video (${mediaFiles.length}/${MAX_MEDIA})`}
                onClick={() => {
                  if (mediaFiles.length >= MAX_MEDIA) {
                    showToast(`Maksimum ${MAX_MEDIA} dosya sınırına ulaştınız.`);
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 hover:text-violet-300 transition-all duration-200 group"
              >
                <ImagePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold hidden sm:inline">
                  Media {mediaFiles.length > 0 && <span className="opacity-60">({mediaFiles.length}/{MAX_MEDIA})</span>}
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Emoji Button */}
              <div className="relative">
                <button
                  title="Insert emoji"
                  onClick={() => setShowEmojiPicker(p => !p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 group ${showEmojiPicker ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300"}`}
                >
                  <Smile className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold hidden sm:inline">Emoji</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 hidden sm:block ${showEmojiPicker ? "rotate-180" : ""}`} />
                </button>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 w-[300px] sm:w-[370px] bg-[#111114]/96 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Category tabs */}
                      <div className="flex border-b border-white/10 bg-black/50 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                        {allCategories.map(cat => (
                          <button key={cat.id} onClick={() => setActiveEmojiCategory(cat.id)} title={cat.name}
                            className={`flex-shrink-0 px-2.5 py-2.5 text-base transition-colors duration-150 hover:bg-white/10 relative ${activeEmojiCategory === cat.id ? "bg-white/5" : ""}`}>
                            {cat.label}
                            {activeEmojiCategory === cat.id && (
                              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-amber-400 rounded-t-full" />
                            )}
                          </button>
                        ))}
                      </div>
                      {/* Category name */}
                      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{activeCategory.name}</p>
                        {activeCategory.id === "recent" && activeCategory.emojis.length === 0 && (
                          <p className="text-[10px] text-neutral-600">Henüz kullanılmadı</p>
                        )}
                      </div>
                      {/* Emoji grid */}
                      {activeCategory.emojis.length === 0 ? (
                        <div className="px-4 pb-6 pt-2 text-center text-neutral-600 text-sm">
                          Emoji kullanmaya başladıkça burada görünür.
                        </div>
                      ) : (
                        <div className="grid grid-cols-8 gap-0 px-1.5 pb-2 max-h-[260px] overflow-y-auto">
                          {activeCategory.emojis.map((emoji, i) => (
                            <button key={i} onClick={() => insertEmoji(emoji)}
                              className="text-xl p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all duration-100 flex items-center justify-center aspect-square leading-none">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Char count */}
              <span className="ml-auto text-xs font-bold text-neutral-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <span className={text.length > 2800 ? "text-red-400" : "text-white"}>{text.length}</span> / 2800
              </span>
            </div>

            {/* Text editor with hashtag highlight */}
            <div className="relative flex-1" style={{ minHeight: "200px" }}>
              {/* Highlight layer */}
              <div
                ref={highlightRef}
                aria-hidden="true"
                className="absolute inset-0 p-8 text-xl font-medium pointer-events-none select-none overflow-hidden"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  lineHeight: "1.625",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                dangerouslySetInnerHTML={{ __html: renderHighlightedText(text) }}
              />
              {/* Transparent textarea on top */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onScroll={handleTextareaScroll}
                disabled={isSubmitting}
                placeholder="What do you want to share with your audience today?"
                className="absolute inset-0 w-full h-full bg-transparent p-8 text-xl resize-none focus:outline-none placeholder:text-neutral-600 font-medium disabled:opacity-50"
                style={{
                  color: "transparent",
                  caretColor: "white",
                  lineHeight: "1.625",
                  fontFamily: "inherit",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Media previews with drag-and-drop */}
            {mediaPreviews.length > 0 && (
              <div className="px-5 pb-5 border-t border-white/5 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-3 flex items-center gap-2">
                  <span>Medya ({mediaFiles.length}/{MAX_MEDIA})</span>
                  <span className="font-normal normal-case tracking-normal text-neutral-700">— sürükleyerek sıralayabilirsiniz</span>
                </p>
                <div className="flex gap-3 flex-wrap">
                  {mediaPreviews.map((src, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDrop={() => handleDrop(i)}
                      onDragEnd={handleDragEnd}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border group shrink-0 transition-all duration-150 ${dragIndex === i ? "opacity-30 scale-95" : ""} ${dragOverIndex === i && dragIndex !== i ? "ring-2 ring-violet-400 scale-105 border-violet-500/50" : "border-white/10"}`}
                      style={{ cursor: dragIndex !== null ? "grabbing" : "grab" }}
                    >
                      {mediaFiles[i]?.type.startsWith("video/") ? (
                        <video src={src} className="w-full h-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                      )}
                      {/* Order badge */}
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                      {/* Remove button */}
                      <button onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/90">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < MAX_MEDIA && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border border-dashed border-white/20 hover:border-violet-500/50 hover:bg-violet-500/5 flex flex-col items-center justify-center text-neutral-500 hover:text-violet-400 transition-all duration-200 shrink-0 gap-1">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[9px] font-bold">{mediaFiles.length}/{MAX_MEDIA}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4">
            <div onClick={() => setAutoOptimize(!autoOptimize)}
              className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-5 py-3.5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-colors group select-none shadow-inner">
              <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative ${autoOptimize ? "bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.5)]" : "bg-neutral-700"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 absolute top-1 ${autoOptimize ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-[15px] font-bold flex items-center gap-2">
                  <Wand2 className={`w-4 h-4 ${autoOptimize ? "text-violet-400" : "text-neutral-500"} transition-colors`} />
                  Auto-Scale Media
                </span>
                <span className="text-neutral-400 text-xs font-medium mt-0.5">Crop & fit seamlessly per platform (1:1, 9:16)</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 flex-wrap ml-auto">
              <button onClick={() => handleSavePost("Draft")} disabled={isSubmitting || !text || selectedPlatforms.length === 0}
                className="glass py-3.5 px-6 rounded-full font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                Save Draft
              </button>
              <button onClick={() => handleSavePost("Scheduled")} disabled={isSubmitting || !text || selectedPlatforms.length === 0 || !subscriptionSnapshot.canPublish}
                className="glass py-3.5 px-6 rounded-full font-bold text-white hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Clock className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />}
                Schedule
              </button>
              <button onClick={() => handleSavePost("Published")} disabled={isSubmitting || !text || selectedPlatforms.length === 0 || !subscriptionSnapshot.canPublish}
                className="bg-violet-600 py-3.5 px-8 rounded-full font-bold text-white hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(139,92,246,0.7)] flex items-center gap-2.5 group hover:-translate-y-0.5 active:translate-y-0 border border-violet-400/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                Post Now
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="lg:col-span-1 mt-8 lg:mt-0 relative">
          <div className="sticky top-10">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Previews
            </h3>
            {selectedPlatforms.length === 0 ? (
              <div className="glass p-8 rounded-3xl text-center border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
                <ImagePlus className="w-10 h-10 text-neutral-600" />
                <p className="text-neutral-500 text-sm font-medium">Select a platform to see how your post will look like.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 pb-4">
                {selectedPlatforms.map(id => {
                  const p = platforms.find(x => x.id === id);
                  return (
                    <div key={id} className="glass p-6 rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-colors shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${p?.activeColor}`}>{p?.icon}</div>
                        <div>
                          <div className="font-bold text-white text-sm">NexoPost App</div>
                          <div className="text-xs text-neutral-400 font-medium">Just now · {p?.name}</div>
                        </div>
                      </div>
                      {/* Preview text with hashtag styling */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium break-words">
                        {text ? (
                          text.split(/((?<!\w)#[\w\u0080-\uFFFF]+|(?<!\w)@[\w.]+)/g).map((part, i) =>
                            /^#[\w\u0080-\uFFFF]+$/.test(part)
                              ? <span key={i} className="text-violet-400 font-bold">{part}</span>
                              : /^@[\w.]+$/.test(part)
                              ? <span key={i} className="text-sky-400 font-bold">{part}</span>
                              : <span key={i} className="text-white">{part}</span>
                          )
                        ) : (
                          <span className="text-neutral-600">Your awesome content goes here...</span>
                        )}
                      </p>
                      {mediaPreviews.length > 0 && (
                        <div className={`grid gap-1 rounded-xl overflow-hidden ${mediaPreviews.length === 1 ? "grid-cols-1" : mediaPreviews.length <= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
                          {mediaPreviews.slice(0, 9).map((src, i) =>
                            mediaFiles[i]?.type.startsWith("video/") ? (
                              <video key={i} src={src} className="w-full aspect-square object-cover" muted />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={src} alt="media" className={`w-full object-cover ${mediaPreviews.length === 1 ? "aspect-video" : "aspect-square"}`} />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

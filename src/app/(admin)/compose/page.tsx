"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Smile, Type, Clock, Loader2, Wand2, ImagePlus, X, ChevronDown, AlertTriangle, Pencil, Check, Layers, BookmarkPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSession } from "next-auth/react";
import {
  buildPostPlatformConfig,
  normalizePostPlatformConfig,
  type PostPlatformConfig,
} from "@/lib/postPlatformConfig";
import { getSubscriptionSnapshot } from "@/lib/subscription";
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
const RETRYABLE_FETCH_ERRORS = ["failed to fetch", "networkerror", "load failed"];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFetchError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return RETRYABLE_FETCH_ERRORS.some((pattern) => message.includes(pattern));
}

function isVideoPreviewUrl(url: string) {
  return /\.(mp4|mov|webm|avi)(\?.*)?$/i.test(url);
}

function createLocalMediaId() {
  return `local-media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface LoadedPostState {
  id: string;
  content?: string;
  platforms?: string[];
  mediaUrls?: string[];
  platformConfig?: PostPlatformConfig;
  _ts?: number;
}

export default function ComposePage() {
  const router = useRouter();
  const { subscription, activeClient } = useApp();
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<"Published" | "Scheduled" | "Draft" | null>(null);
  const [autoOptimize, setAutoOptimize] = useState(true);

  // Schedule date/time (inline in footer)
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // No-caption warning
  const [showNoCaptionWarning, setShowNoCaptionWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ status: "Scheduled" | "Published" | "Draft"; date?: string; time?: string } | null>(null);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Per-platform caption overrides & edit mode
  const [platformTexts, setPlatformTexts] = useState<Record<string, string>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [platformEmojiOpen, setPlatformEmojiOpen] = useState<string | null>(null);

  // Media
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaFileIds, setMediaFileIds] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Already-uploaded media from Firestore (edit mode)
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

  // Per-platform media management
  const [platformMediaItemIds, setPlatformMediaItemIds] = useState<Record<string, string[]>>({});
  const [dragOverPlatform, setDragOverPlatform] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Submission guard ref — set synchronously to prevent double-fire before state update lands
  const isSubmittingRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const platformTextareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const subscriptionSnapshot = getSubscriptionSnapshot(subscription);

  const applyLoadedPostState = useCallback((data: LoadedPostState) => {
    const content = data.content ?? "";
    const loadedPlatforms = data.platforms?.length ? data.platforms : ["twitter"];
    const loadedMediaUrls = data.mediaUrls ?? [];
    const normalizedConfig = normalizePostPlatformConfig(
      data.platformConfig,
      loadedPlatforms,
      loadedMediaUrls
    );

    setEditingPostId(data.id);
    setText(content);
    setSelectedPlatforms(loadedPlatforms);
    setExistingMediaUrls(loadedMediaUrls);
    setMediaFiles([]);
    setMediaFileIds([]);
    setMediaPreviews([]);
    setPlatformTexts(
      Object.entries(normalizedConfig.textByPlatform).reduce<Record<string, string>>((acc, [platformId, platformText]) => {
        if (platformText !== content) {
          acc[platformId] = platformText;
        }
        return acc;
      }, {})
    );
    setPlatformMediaItemIds(
      loadedPlatforms.reduce<Record<string, string[]>>((acc, platformId) => {
        acc[platformId] = normalizedConfig.mediaByPlatform[platformId];
        return acc;
      }, {})
    );
    setEditingPlatform(null);
  }, []);

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

  // Load post for editing — checks localStorage first (set by scheduled page just before navigate).
  // Uses a timestamp to avoid accidentally loading stale data. Falls back to Firestore if needed.
  useEffect(() => {
    // Step 1: try localStorage — reliable regardless of URL timing
    try {
      const cached = localStorage.getItem("nexopost_edit_post");
      if (cached) {
        const data = JSON.parse(cached) as LoadedPostState;
        const isRecent = !data._ts || (Date.now() - data._ts) < 15000; // within 15 seconds
        if (isRecent && data.id) {
          localStorage.removeItem("nexopost_edit_post");
          applyLoadedPostState(data);
          return;
        } else {
          localStorage.removeItem("nexopost_edit_post");
        }
      }
    } catch {}

    // Step 2: fall back to URL param + API fetch
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    setEditingPostId(editId);
    (async () => {
      try {
        const res = await fetch(`/api/posts/${editId}`);
        if (!res.ok) {
          setEditingPostId(null);
          router.replace("/compose");
          return;
        }
        const data = await res.json() as LoadedPostState;
        applyLoadedPostState({ ...data, id: editId });
      } catch (e) {
        console.error("Edit load error:", e);
        setEditingPostId(null);
        router.replace("/compose");
      }
    })();
  }, [applyLoadedPostState, router]);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "error") => {
    setToast({ message: msg, type });
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
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(prev => prev.filter(p => p !== id));
      setPlatformTexts(prev => { const n = { ...prev }; delete n[id]; return n; });
      setPlatformMediaItemIds(prev => { const n = { ...prev }; delete n[id]; return n; });
      if (editingPlatform === id) setEditingPlatform(null);
    } else {
      const allMediaIds = [...existingMediaUrls, ...mediaFileIds];
      setSelectedPlatforms(prev => [...prev, id]);
      setPlatformMediaItemIds(prev => ({ ...prev, [id]: allMediaIds }));
    }
  };

  useEffect(() => {
    if (selectedPlatforms.length === 0) return;

    setPlatformMediaItemIds(prev => {
      const next = { ...prev };
      const allMediaIds = [...existingMediaUrls, ...mediaFileIds];
      const knownMedia = new Set(allMediaIds);

      selectedPlatforms.forEach((platformId) => {
        if (!Object.prototype.hasOwnProperty.call(next, platformId)) {
          next[platformId] = allMediaIds;
          return;
        }

        next[platformId] = next[platformId].filter((mediaId) => knownMedia.has(mediaId));
      });

      Object.keys(next).forEach((platformId) => {
        if (!selectedPlatforms.includes(platformId)) {
          delete next[platformId];
        }
      });

      return next;
    });
  }, [existingMediaUrls, mediaFileIds, selectedPlatforms]);

  // Sync textarea scroll → highlight layer
  const handleTextareaScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Insert emoji at cursor — supports both main textarea and platform-specific textarea
  const insertEmoji = (emoji: string) => {
    if (editingPlatform) {
      const ta = platformTextareaRef.current;
      const currentText = platformTexts[editingPlatform] ?? text;
      const start = ta?.selectionStart ?? currentText.length;
      const end = ta?.selectionEnd ?? currentText.length;
      const newText = currentText.slice(0, start) + emoji + currentText.slice(end);
      setPlatformTexts(prev => ({ ...prev, [editingPlatform]: newText }));
      setTimeout(() => {
        if (ta) { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }
      }, 0);
    } else {
      const ta = textareaRef.current;
      const start = ta?.selectionStart ?? text.length;
      const end = ta?.selectionEnd ?? text.length;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      setTimeout(() => {
        if (ta) { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }
      }, 0);
    }
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
    const totalMedia = mediaFiles.length + existingMediaUrls.length;
    if (totalMedia >= MAX_MEDIA) {
      showToast(`Maximum ${MAX_MEDIA} files allowed. You've reached your limit.`);
      e.target.value = "";
      return;
    }
    const remaining = MAX_MEDIA - totalMedia;
    const toAdd = files.slice(0, remaining);
    const overflow = files.length - toAdd.length;
    const newIds = toAdd.map(() => createLocalMediaId());
    const newFiles = [...mediaFiles, ...toAdd];
    setMediaFiles(newFiles);
    setMediaPreviews(newFiles.map((f, i) => i < mediaFiles.length ? mediaPreviews[i] : URL.createObjectURL(f)));
    setMediaFileIds(prev => [...prev, ...newIds]);
    setPlatformMediaItemIds(prev => {
      const updated = { ...prev };
      selectedPlatforms.forEach(pid => {
        const existing = updated[pid] ?? [...existingMediaUrls, ...mediaFileIds];
        updated[pid] = [...existing, ...newIds];
      });
      return updated;
    });
    if (overflow > 0) {
      showToast(`${overflow} file(s) not added — maximum ${MAX_MEDIA} file limit reached.`);
    }
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    const removedId = mediaFileIds[index];
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    setMediaFileIds(prev => prev.filter((_, i) => i !== index));
    if (!removedId) return;
    setPlatformMediaItemIds(prev => {
      const updated: Record<string, string[]> = {};
      Object.entries(prev).forEach(([pid, mediaIds]) => {
        updated[pid] = mediaIds.filter((mediaId) => mediaId !== removedId);
      });
      return updated;
    });
  };

  const removeExistingMedia = (index: number) => {
    const removedUrl = existingMediaUrls[index];
    setExistingMediaUrls(prev => prev.filter((_, i) => i !== index));
    if (!removedUrl) return;
    setPlatformMediaItemIds(prev => {
      const updated: Record<string, string[]> = {};
      Object.entries(prev).forEach(([pid, mediaIds]) => {
        updated[pid] = mediaIds.filter((mediaId) => mediaId !== removedUrl);
      });
      return updated;
    });
  };

  // Drag-and-drop reordering
  const handleDragStart = (mediaId: string, index?: number) => {
    setDraggedMediaId(mediaId);
    setDragIndex(index ?? null);
  };
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
    setMediaFileIds(prev => {
      const next = [...prev];
      const [mediaId] = next.splice(dragIndex, 1);
      next.splice(i, 0, mediaId);
      return next;
    });
    setDragIndex(null); setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDraggedMediaId(null); setDragIndex(null); setDragOverIndex(null); setDragOverPlatform(null); };

  const removePlatformMedia = (platformId: string, mediaPosition: number) => {
    setPlatformMediaItemIds(prev => ({
      ...prev,
      [platformId]: (prev[platformId] || []).filter((_, index) => index !== mediaPosition),
    }));
  };

  const addMediaToPlatform = (platformId: string, mediaId: string) => {
    setPlatformMediaItemIds(prev => {
      const current = prev[platformId] || [];
      if (current.includes(mediaId)) return prev;
      return { ...prev, [platformId]: [...current, mediaId] };
    });
  };

  const hasContent = text.trim().length > 0 || mediaFiles.length > 0 || existingMediaUrls.length > 0;

  // Show no-caption warning for media-only posts, then proceed
  const triggerPost = (status: "Scheduled" | "Published" | "Draft", date?: string, time?: string) => {
    if (isSubmittingRef.current) return;
    if (!text.trim() && (mediaFiles.length > 0 || existingMediaUrls.length > 0) && status !== "Draft") {
      setPendingAction({ status, date, time });
      setShowNoCaptionWarning(true);
      return;
    }
    handleSavePost(status, date, time);
  };

  const handleSavePost = async (status: "Scheduled" | "Published" | "Draft", overrideDate?: string, overrideTime?: string) => {
    if (isSubmittingRef.current || !hasContent || selectedPlatforms.length === 0) return;
    if ((status === "Scheduled" || status === "Published") && !subscriptionSnapshot.canPublish) {
      showToast("Your package has expired. Renew your subscription to schedule or publish new posts.");
      return;
    }
    isSubmittingRef.current = true;
    setSubmittingAction(status);

    // Safety timeout — force-resets state after 25s if something hangs
    const safetyTimer = setTimeout(() => {
      isSubmittingRef.current = false;
      setSubmittingAction(null);
      showToast("Request timed out. Please check your connection and try again.");
    }, 25000);

    try {
      const now = new Date();
      const displayDate = overrideDate
        ? new Date(overrideDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const displayTime = overrideTime || now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

      // Upload new media files to Cloudinary
      let uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        uploadedUrls = await Promise.race([
          Promise.all(
            mediaFiles.map(async (file) => {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("upload_preset", uploadPreset!);
              const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                { method: "POST", body: formData }
              );
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(`Cloudinary: ${errData?.error?.message || res.status}`);
              }
              const data = await res.json();
              return data.secure_url as string;
            })
          ),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Upload timed out")), 30000)
          ),
        ]);
      }
      const allMediaUrls = [...existingMediaUrls, ...uploadedUrls];
      const uploadedMediaUrlById = mediaFileIds.reduce<Record<string, string>>((acc, mediaId, index) => {
        const uploadedUrl = uploadedUrls[index];
        if (uploadedUrl) acc[mediaId] = uploadedUrl;
        return acc;
      }, {});
      const textByPlatform = selectedPlatforms.reduce<Record<string, string>>((acc, platformId) => {
        acc[platformId] = platformTexts[platformId] ?? text;
        return acc;
      }, {});
      const mediaByPlatform = selectedPlatforms.reduce<Record<string, string[]>>((acc, platformId) => {
        const platformMediaIds = platformMediaItemIds[platformId] ?? [...existingMediaUrls, ...mediaFileIds];
        acc[platformId] = platformMediaIds
          .map((mediaId) => uploadedMediaUrlById[mediaId] ?? (existingMediaUrls.includes(mediaId) ? mediaId : undefined))
          .filter((mediaUrl): mediaUrl is string => typeof mediaUrl === "string");

        return acc;
      }, {});

      const payload = {
        content: text,
        platforms: selectedPlatforms,
        status,
        date: displayDate,
        time: displayTime,
        autoOptimize,
        mediaUrls: allMediaUrls,
        platformConfig: buildPostPlatformConfig(selectedPlatforms, textByPlatform, mediaByPlatform),
        ...(status === "Scheduled" && overrideDate && overrideTime
          ? { scheduledAt: new Date(`${overrideDate}T${overrideTime}`).toISOString() }
          : {}),
      };

      const userId = session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      if (editingPostId) {
        await Promise.race([
          saveEditedPost(editingPostId, payload),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 20000)
          ),
        ]);
        setEditingPostId(null);
      } else {
        await Promise.race([
          fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, userId }),
          }).then(async (r) => { if (!r.ok) throw new Error(await r.text()); }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 20000)
          ),
        ]);
      }

      setText("");
      setMediaFiles([]);
      setMediaFileIds([]);
      setMediaPreviews([]);
      setExistingMediaUrls([]);
      setPlatformMediaItemIds({});
      setPlatformTexts({});
      setEditingPlatform(null);
      setSelectedPlatforms(["twitter"]);
      setScheduleDate("");
      setScheduleTime("");
      setPendingAction(null);
      if (status === "Published") showToast("Post published successfully!", "success");
      else if (status === "Scheduled") showToast(`Scheduled for ${displayDate} at ${displayTime}`, "info");
      else showToast("Draft saved. You can edit it anytime in Scheduled Pipeline.", "success");
    } catch (error) {
      console.error("handleSavePost error:", error);
      const errMsg = (error instanceof Error ? error.message : String(error)).toLowerCase();
      if (errMsg.includes("cloudinary")) {
        showToast(`Image upload failed — ${error instanceof Error ? error.message : "Cloudinary error"}`);
      } else if (errMsg.includes("not authenticated")) {
        showToast("You must be logged in to save posts.");
      } else {
        showToast(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      clearTimeout(safetyTimer);
      isSubmittingRef.current = false;
      setSubmittingAction(null);
    }
  };

  // Build category list with "Recent" first
  const recentCategory = { id: "recent", label: "🕐", name: "Recently Used", emojis: recentEmojis };
  const allCategories = recentEmojis.length > 0
    ? [recentCategory, ...EMOJI_CATEGORIES]
    : EMOJI_CATEGORIES;
  const activeCategory = allCategories.find(c => c.id === activeEmojiCategory) ?? allCategories[0];

  const saveEditedPost = useCallback(async (postId: string, payload: {
    content: string;
    platforms: string[];
    status: "Scheduled" | "Published" | "Draft";
    date: string;
    time: string;
    autoOptimize: boolean;
    mediaUrls: string[];
    platformConfig: PostPlatformConfig;
    scheduledAt?: string;
  }) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        return;
      } catch (error) {
        lastError = error;

        if (attempt === 1 || !isRetryableFetchError(error)) {
          throw error;
        }

        await delay(700);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Save failed");
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/60 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 max-w-sm text-center ${
          toast.type === "success" ? "bg-[#091a0f] border border-emerald-500/50 text-emerald-200" :
          toast.type === "info"    ? "bg-[#0d0d1a] border border-sky-500/50 text-sky-200" :
                                     "bg-[#1a1209] border border-amber-500/50 text-amber-200"
        }`}>
          {toast.type === "success" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> :
           toast.type === "info"    ? <Clock className="w-4 h-4 text-sky-400 shrink-0" /> :
                                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toast.message}
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
        {editingPostId && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200">
            <Pencil className="w-4 h-4 text-violet-400 shrink-0" />
            Editing an existing post — saving will update the original.
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
                title={`Add photo or video (${existingMediaUrls.length + mediaFiles.length}/${MAX_MEDIA})`}
                onClick={() => {
                  if (existingMediaUrls.length + mediaFiles.length >= MAX_MEDIA) {
                    showToast(`Maximum ${MAX_MEDIA} file limit reached.`);
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 hover:text-violet-300 transition-all duration-200 group"
              >
                <ImagePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold hidden sm:inline">
                  Media {(existingMediaUrls.length + mediaFiles.length) > 0 && <span className="opacity-60">({existingMediaUrls.length + mediaFiles.length}/{MAX_MEDIA})</span>}
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
                          <p className="text-[10px] text-neutral-600">None yet</p>
                        )}
                      </div>
                      {/* Emoji grid */}
                      {activeCategory.emojis.length === 0 ? (
                        <div className="px-4 pb-6 pt-2 text-center text-neutral-600 text-sm">
                          Start using emojis and they&apos;ll appear here.
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

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Save as Draft */}
              <button
                title="Save as Draft"
                onClick={() => triggerPost("Draft")}
                disabled={submittingAction !== null || !hasContent}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingAction === "Draft" ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                <span className="text-xs font-bold hidden sm:inline">Save Draft</span>
              </button>

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
                disabled={submittingAction !== null}
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
            {(existingMediaUrls.length > 0 || mediaPreviews.length > 0) && (
              <div className="px-5 pb-5 border-t border-white/5 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-3 flex items-center gap-2">
                  <span>Media ({existingMediaUrls.length + mediaFiles.length}/{MAX_MEDIA})</span>
                  {mediaPreviews.length > 0 && <span className="font-normal normal-case tracking-normal text-neutral-700">— drag to reorder · drop onto preview to add</span>}
                </p>
                <div className="flex gap-3 flex-wrap">
                  {/* Existing media from saved post */}
                  {existingMediaUrls.map((url, i) => (
                    <div
                      key={`existing-${i}`}
                      draggable
                      onDragStart={() => handleDragStart(url)}
                      onDragEnd={handleDragEnd}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-sky-500/30 group shrink-0"
                      style={{ cursor: draggedMediaId === url ? "grabbing" : "grab" }}
                    >
                      {/\.(mp4|mov|webm|avi)/i.test(url) ? (
                        <video src={url} className="w-full h-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="existing media" className="w-full h-full object-cover" />
                      )}
                      <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-sky-500/80 text-white px-1 rounded">saved</span>
                      <button onClick={() => removeExistingMedia(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/90">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* New media files */}
                  {mediaPreviews.map((src, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => handleDragStart(mediaFileIds[i], i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDrop={() => handleDrop(i)}
                      onDragEnd={handleDragEnd}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border group shrink-0 transition-all duration-150 ${dragIndex === i ? "opacity-30 scale-95" : ""} ${dragOverIndex === i && dragIndex !== i ? "ring-2 ring-violet-400 scale-105 border-violet-500/50" : "border-white/10"}`}
                      style={{ cursor: draggedMediaId === mediaFileIds[i] ? "grabbing" : "grab" }}
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
                  {(existingMediaUrls.length + mediaFiles.length) < MAX_MEDIA && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border border-dashed border-white/20 hover:border-violet-500/50 hover:bg-violet-500/5 flex flex-col items-center justify-center text-neutral-500 hover:text-violet-400 transition-all duration-200 shrink-0 gap-1">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[9px] font-bold">{existingMediaUrls.length + mediaFiles.length}/{MAX_MEDIA}</span>
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

            <div className="flex items-end gap-3 ml-auto">
              {/* Date above time */}
              <div className="flex flex-col gap-1.5">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-sky-500/50 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-sky-500/50 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              {/* Schedule then Post Now side by side */}
              <button
                onClick={() => {
                  if (!scheduleDate || !scheduleTime) { showToast("Please select a date and time to schedule."); return; }
                  triggerPost("Scheduled", scheduleDate, scheduleTime);
                }}
                disabled={submittingAction !== null || !hasContent || selectedPlatforms.length === 0 || !subscriptionSnapshot.canPublish}
                className="glass py-3 px-5 rounded-full font-bold text-white hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md">
                {submittingAction === "Scheduled" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />}
                Schedule
              </button>
              <button onClick={() => triggerPost("Published")} disabled={submittingAction !== null || !hasContent || selectedPlatforms.length === 0 || !subscriptionSnapshot.canPublish}
                className="bg-violet-600 py-3 px-7 rounded-full font-bold text-white hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(139,92,246,0.7)] flex items-center gap-2 group hover:-translate-y-0.5 active:translate-y-0 border border-violet-400/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {submittingAction === "Published" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                Post Now
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="lg:col-span-1 mt-8 lg:mt-0 relative">
          <div className="sticky top-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Previews
              </h3>
              {selectedPlatforms.length > 0 && (
                <button
                  onClick={() => triggerPost("Published")}
                  disabled={submittingAction !== null || !text || !subscriptionSnapshot.canPublish}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] disabled:opacity-40 disabled:cursor-not-allowed border border-violet-400/40"
                >
                  <Layers className="w-3 h-3" />
                  Bulk Share
                </button>
              )}
            </div>

            {selectedPlatforms.length === 0 ? (
              <div className="glass p-8 rounded-3xl text-center border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
                <ImagePlus className="w-10 h-10 text-neutral-600" />
                <p className="text-neutral-500 text-sm font-medium">Select a platform to start previewing.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1 pb-4" style={{ maxHeight: "calc(100vh - 180px)" }}>
                {selectedPlatforms.map(id => {
                  const p = platforms.find(x => x.id === id);
                  const displayText = platformTexts[id] ?? text;
                  const isEditing = editingPlatform === id;
                  return (
                    <div key={id} className="glass rounded-[1.75rem] border border-white/5 hover:border-white/10 transition-all duration-200 shadow-xl overflow-hidden">
                      {/* Card header */}
                      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-inner shrink-0 ${p?.activeColor}`}>{p?.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm leading-tight">NexoPost App</div>
                          <div className="text-[11px] text-neutral-500 font-medium">Just now · {p?.name}</div>
                        </div>
                        {/* Edit toggle */}
                        <button
                          onClick={() => setEditingPlatform(isEditing ? null : id)}
                          title={isEditing ? "Done editing" : `Edit for ${p?.name}`}
                          className={`p-1.5 rounded-lg transition-colors ${isEditing ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-white/10 text-neutral-500 hover:text-white"}`}
                        >
                          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        </button>
                        {/* Remove platform */}
                        <button
                          onClick={() => handleToggle(id)}
                          title={`Remove ${p?.name} from post`}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Card body */}
                      <div className="p-4 space-y-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                Custom content for {p?.name}
                              </p>
                              {/* Inline emoji button for platform edit */}
                              <div className="relative">
                                <button
                                  onClick={() => setPlatformEmojiOpen(platformEmojiOpen === id ? null : id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${platformEmojiOpen === id ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-white/5 border-white/10 text-neutral-400 hover:text-amber-300 hover:border-amber-500/30"}`}
                                >
                                  <Smile className="w-3 h-3" /> Emoji
                                </button>
                                {platformEmojiOpen === id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setPlatformEmojiOpen(null)} />
                                    <div className="absolute right-0 top-full mt-1 z-50 w-[280px] bg-[#111114]/96 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                      {/* Category tabs */}
                                      <div className="flex border-b border-white/10 bg-black/50 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                                        {allCategories.map(cat => (
                                          <button key={cat.id} onClick={() => setActiveEmojiCategory(cat.id)} title={cat.name}
                                            className={`flex-shrink-0 px-2 py-2 text-base transition-colors hover:bg-white/10 relative ${activeEmojiCategory === cat.id ? "bg-white/5" : ""}`}>
                                            {cat.label}
                                            {activeEmojiCategory === cat.id && (
                                              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-t-full" />
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="px-2 pt-1.5 pb-0.5">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">{activeCategory.name}</p>
                                      </div>
                                      <div className="grid grid-cols-8 gap-0 px-1 pb-2 max-h-[200px] overflow-y-auto">
                                        {activeCategory.emojis.map((emoji, i) => (
                                          <button key={i}
                                            onClick={() => { insertEmoji(emoji); setPlatformEmojiOpen(null); }}
                                            className="text-lg p-1 rounded-lg hover:bg-white/10 active:scale-90 transition-all duration-100 flex items-center justify-center aspect-square leading-none">
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <textarea
                              ref={platformTextareaRef}
                              value={platformTexts[id] ?? text}
                              onChange={e => setPlatformTexts(prev => ({ ...prev, [id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50 transition-colors font-medium placeholder:text-neutral-600"
                              rows={5}
                              placeholder="Write custom content for this platform..."
                            />
                            {platformTexts[id] !== undefined && platformTexts[id] !== text && (
                              <button
                                onClick={() => setPlatformTexts(prev => { const n = { ...prev }; delete n[id]; return n; })}
                                className="text-[10px] text-neutral-500 hover:text-red-400 transition-colors font-medium"
                              >
                                ↩ Reset to main text
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium break-words">
                            {displayText ? (
                              displayText.split(/((?<!\w)#[\w\u0080-\uFFFF]+|(?<!\w)@[\w.]+)/g).map((part, i) =>
                                /^#[\w\u0080-\uFFFF]+$/.test(part)
                                  ? <span key={i} className="text-violet-400 font-bold">{part}</span>
                                  : /^@[\w.]+$/.test(part)
                                  ? <span key={i} className="text-sky-400 font-bold">{part}</span>
                                  : <span key={i} className="text-white">{part}</span>
                              )
                            ) : (
                              <span className="text-neutral-600">Your content will appear here...</span>
                            )}
                          </p>
                        )}

                        {/* Platform-specific override indicator */}
                        {platformTexts[id] !== undefined && platformTexts[id] !== text && !isEditing && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-bold">
                            <Pencil className="w-2.5 h-2.5" /> Customized for this platform
                          </div>
                        )}

                        {/* Per-platform media grid with remove + drag-to-add */}
                        {(() => {
                          const platformMediaIds = platformMediaItemIds[id] ?? [...existingMediaUrls, ...mediaFileIds];
                          const isDragTarget = draggedMediaId !== null && dragOverPlatform === id;
                          const canDropHere = draggedMediaId !== null && !platformMediaIds.includes(draggedMediaId);
                          const hasAnyMedia = existingMediaUrls.length > 0 || mediaPreviews.length > 0;
                          if (!hasAnyMedia) return null;
                          return (
                            <div
                              onDragOver={e => { e.preventDefault(); setDragOverPlatform(id); }}
                              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPlatform(null); }}
                              onDrop={e => { e.preventDefault(); if (draggedMediaId) addMediaToPlatform(id, draggedMediaId); setDragOverPlatform(null); }}
                              className={`rounded-xl transition-all duration-200 ${isDragTarget && canDropHere ? "ring-2 ring-violet-400 ring-offset-1 ring-offset-black" : ""}`}
                            >
                              {platformMediaIds.length > 0 ? (
                                <div className={`grid gap-1 rounded-xl overflow-hidden transition-all duration-200 ${platformMediaIds.length === 1 ? "grid-cols-1" : platformMediaIds.length <= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
                                  {platformMediaIds.map((mediaId, mediaPosition) => {
                                    const isSavedMedia = existingMediaUrls.includes(mediaId);
                                    const fileIndex = mediaFileIds.indexOf(mediaId);
                                    const src = isSavedMedia ? mediaId : mediaPreviews[fileIndex];
                                    const file = fileIndex >= 0 ? mediaFiles[fileIndex] : undefined;
                                    if (!src) return null;
                                    return (
                                      <div key={`${id}-${mediaId}-${mediaPosition}`} className="relative group overflow-hidden">
                                        {((isSavedMedia && isVideoPreviewUrl(src)) || file?.type.startsWith("video/")) ? (
                                          <video src={src} className="w-full aspect-square object-cover" muted />
                                        ) : (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={src} alt={isSavedMedia ? "saved media" : "media"} className="w-full aspect-square object-cover" />
                                        )}
                                        {isSavedMedia && (
                                          <span className="absolute left-1 top-1 rounded-full bg-sky-500/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                                            saved
                                          </span>
                                        )}
                                        <button
                                          onClick={() => removePlatformMedia(id, mediaPosition)}
                                          title={isSavedMedia ? "Remove saved media from this platform" : "Remove from this platform"}
                                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/90"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className={`rounded-xl border border-dashed p-3 text-center transition-colors ${isDragTarget ? "border-violet-400 bg-violet-500/10" : "border-white/10"}`}>
                                  <p className="text-[11px] text-neutral-600">No media — drag from the left panel</p>
                                </div>
                              )}
                              {/* Drop hint when dragging a non-included media */}
                              {canDropHere && (
                                <div className={`mt-1 flex items-center justify-center gap-1.5 p-1.5 rounded-lg border border-dashed text-[10px] font-medium transition-colors ${isDragTarget ? "border-violet-400 bg-violet-500/10 text-violet-300" : "border-white/10 text-neutral-600"}`}>
                                  <ImagePlus className="w-3 h-3" /> Drop here to add
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* No-Caption Warning Modal */}
      {showNoCaptionWarning && pendingAction && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setShowNoCaptionWarning(false); setPendingAction(null); }}>
          <div className="glass p-8 rounded-[2rem] border border-amber-500/20 shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No caption</h3>
                <p className="text-neutral-500 text-xs">You&apos;re about to post without any text</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 font-medium mb-6 leading-relaxed">
              Your post will contain media only, with no caption. Some platforms may display it differently. Do you want to continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNoCaptionWarning(false); setPendingAction(null); }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 font-bold transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowNoCaptionWarning(false);
                  if (pendingAction) await handleSavePost(pendingAction.status, pendingAction.date, pendingAction.time);
                  setPendingAction(null);
                }}
                disabled={submittingAction !== null}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingAction !== null
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : pendingAction?.status === "Scheduled"
                    ? <Clock className="w-4 h-4" />
                    : <Send className="w-4 h-4" />}
                {pendingAction?.status === "Scheduled" ? "Schedule anyway" : "Post anyway"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

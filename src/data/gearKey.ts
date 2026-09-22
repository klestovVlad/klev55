/**
 * Determination key for tackle, like a botanical key: a few yes/no-ish questions lead to a glossary
 * card. Every leaf is a gear id from content/gear.json. Kept in data so authors can extend it.
 */
export interface KeyOption {
  label: string;
  next?: string; // node id
  result?: string[]; // gear ids
  hint?: string; // shown with the result
}

export interface KeyNode {
  id: string;
  question: string;
  options: KeyOption[];
}

export const GEAR_KEY: KeyNode[] = [
  {
    id: 'root',
    question: 'Что у вас в руках?',
    options: [
      { label: 'Металлическая приманка', next: 'metal' },
      { label: 'Пластиковая, с лопаткой или без', next: 'plastic' },
      { label: 'Мягкая, силикон или поролон', next: 'soft' },
      { label: 'Крючки, грузила, кормушка, поводки', next: 'rig' },
      { label: 'Что-то живое или съедобное', next: 'bait' },
      { label: 'Удилище или снасть целиком', next: 'rod' },
    ],
  },
  {
    id: 'metal',
    question: 'Как она устроена?',
    options: [
      { label: 'Лепесток крутится вокруг оси', result: ['vertushka'] },
      { label: 'Изогнутая пластина с тройником', result: ['koleblyalka'] },
      { label: 'Узкая, вертикальная, крючок внизу или подвесной тройник', result: ['vertikalnaya-blesna'] },
      { label: 'Рыбка с крыльями или хвостом, подвес за спину', result: ['balansir'] },
      { label: 'Маленькая, крючок впаян в дробинку или каплю', next: 'mormyshka' },
      { label: 'Свинцовая головка с крючком, без тела', result: ['dzhig'], hint: 'Это джиг-головка: на неё надевают силикон.' },
    ],
  },
  {
    id: 'mormyshka',
    question: 'Есть ли на крючке бисер, кембрик или «крылышки»?',
    options: [
      { label: 'Да, что-то нанизано и болтается', result: ['bezmotylka'] },
      { label: 'Нет, голый крючок', result: ['mormyshka'], hint: 'Обычная мормышка под мотыля или мормыша.' },
    ],
  },
  {
    id: 'plastic',
    question: 'Есть лопатка спереди?',
    options: [
      { label: 'Да, прозрачная или цветная лопатка', result: ['vobler'], hint: 'Смотрите код на брюшке или упаковке: F, SP, S и SR/MR/DR — ниже есть расшифровка.' },
      { label: 'Нет, плоское тело с петлёй сверху', result: ['balansir', 'vobler'], hint: 'Без лопатки и с петлёй на спине это, скорее всего, раттлин или балансир.' },
      { label: 'Шарик или цилиндр, твёрдый, пахнет', result: ['boyl', 'pellets'] },
    ],
  },
  {
    id: 'soft',
    question: 'Из чего она?',
    options: [
      { label: 'Силикон: виброхвост, твистер, червь', result: ['dzhig'] },
      { label: 'Поролон, вырезан вручную или заводской', result: ['porolonka'] },
      { label: 'Мягкая, вязкая масса или шарики теста', result: ['testo', 'khleb'] },
    ],
  },
  {
    id: 'rig',
    question: 'Что там главное?',
    options: [
      { label: 'Кормушка на леске', next: 'feeder' },
      { label: 'Грузило на конце, поводок с крючком выше', next: 'lead-end' },
      { label: 'Пружина или спираль с крючками на коротких поводках', result: ['pruzhina'] },
      { label: 'Большое кольцо или тяжёлое грузило с отверстием', result: ['koltso'] },
      { label: 'Мотовило с толстой леской, грузилом и крючками', result: ['zakidushka'] },
      { label: 'Поплавок с отверстием насквозь, стопоры', result: ['skolzyashchiy-poplavok'] },
      { label: 'Катушка-стойка с флажком', result: ['zherlitsa'] },
      { label: 'Мотовильце с леской, грузом и крючком под лунку', result: ['postavushka'] },
    ],
  },
  {
    id: 'feeder',
    question: 'Как кормушка крепится к основной леске?',
    options: [
      { label: 'На отводе, поводок идёт дальше по леске', result: ['paternoster'] },
      { label: 'Скользит по леске, поводок за стопором', result: ['inlayn'] },
      { label: 'В петле, одна сторона длиннее другой', result: ['asimmetrichnaya-petlya'] },
    ],
  },
  {
    id: 'lead-end',
    question: 'Как далеко поводок от грузила?',
    options: [
      { label: '20–40 см, крючок на узле прямо на леске', result: ['drop-shot'] },
      { label: 'Метр и больше, отдельный отвод', result: ['otvodnoy-povodok'] },
    ],
  },
  {
    id: 'bait',
    question: 'Живое или растительное?',
    options: [
      { label: 'Живое, шевелится', next: 'live' },
      { label: 'Зерно, крупа, хлеб, консервы', next: 'plant' },
      { label: 'Живая рыбка', result: ['zhivets'] },
    ],
  },
  {
    id: 'live',
    question: 'Как выглядит?',
    options: [
      { label: 'Красный тонкий червячок, 1–2 см', result: ['motyl'] },
      { label: 'Белая личинка-бочонок, 5–8 мм', result: ['oparysh'] },
      { label: 'Дождевой или навозный червь', result: ['cherv'] },
      { label: 'Личинка в домике из песчинок или палочек', result: ['rucheynik'] },
      { label: 'Белая толстая личинка из-под коры', result: ['koroed'] },
      { label: 'Мелкий серый рачок, боком плавает', result: ['mormysh'] },
    ],
  },
  {
    id: 'plant',
    question: 'Что именно?',
    options: [
      { label: 'Горох, целый или пареный', result: ['gorokh'] },
      { label: 'Перловка', result: ['perlovka'] },
      { label: 'Кукуруза', result: ['kukuruza'] },
      { label: 'Тесто, мастырка, манка', result: ['testo'] },
      { label: 'Хлеб', result: ['khleb'] },
      { label: 'Прессованные гранулы или шарики', result: ['pellets', 'boyl'] },
      { label: 'Пористый брикет на стержне', result: ['tekhnoplankton'] },
    ],
  },
  {
    id: 'rod',
    question: 'Какая снасть?',
    options: [
      { label: 'Короткое, до 2,7 м, кольца, катушкодержатель', result: ['spinning'], hint: 'Прочитайте маркировку на бланке: тест, мощность и строй — выше есть расшифровка.' },
      { label: 'Длинное 3–4 м, кольца, тонкая сменная вершинка', result: ['fider'] },
      { label: 'Длинный телескоп с кольцами, 5–7 м', result: ['bolonskaya-udochka'] },
      { label: 'Телескоп без колец и катушки', result: ['makhovaya-udochka'] },
      { label: 'Короткая, 30–40 см, с кивком или катушкой на рукояти', result: ['zimnyaya-udochka'] },
      { label: 'Стойка с катушкой и флажком', result: ['zherlitsa'] },
    ],
  },
];

export const KEY_BY_ID = new Map(GEAR_KEY.map((n) => [n.id, n]));

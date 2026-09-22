# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: jobs.spec.ts >> 9. tapping a cluster bubble zooms in to split it
- Location: e2e/jobs.spec.ts:92:1

# Error details

```
TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - main [ref=e4]:
    - generic [ref=e5]:
      - region "Карта мест рыбалки" [ref=e6]:
        - region "Map" [ref=e7]
        - generic:
          - generic:
            - generic [ref=e8]:
              - button "Zoom in" [ref=e9] [cursor=pointer]
              - button "Zoom out" [ref=e11] [cursor=pointer]
            - button "Find my location" [ref=e14] [cursor=pointer]
          - generic:
            - group:
              - generic "Toggle attribution" [ref=e16] [cursor=pointer]
      - generic:
        - generic [ref=e17]:
          - button "Поиск мест, водоёмов и рыб" [ref=e18] [cursor=pointer]:
            - generic [ref=e22]: Место, вода, рыба
          - button "Слои и фильтры" [ref=e23] [cursor=pointer]
        - generic [ref=e26]:
          - button "Любая рыба" [ref=e27] [cursor=pointer]:
            - text: Любая рыба
            - generic [aria-hidden] [ref=e28]: ▾
          - 'button "Время в пути: любое" [ref=e29] [cursor=pointer]': Любая даль
          - button "Со льда" [ref=e30] [cursor=pointer]
          - button "Бесплатно" [ref=e31] [cursor=pointer]
      - note "Легенда погодного слоя":
        - generic: ветер по потоку
        - generic: дождь
        - generic: облака
        - generic: прогноз на выбранный час, 15:42
      - complementary [ref=e32]:
        - paragraph [ref=e33]: "Щука сейчас: отлично — Омь у Калачинска, 92 мин"
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]: Когда
            - strong [ref=e37]: сейчас
          - slider "Время прогноза" [ref=e38] [cursor=pointer]: "0"
          - generic [aria-hidden] [ref=e39]:
            - generic [ref=e40]: сейчас
            - generic [ref=e41]: +24 ч
            - generic [ref=e42]: +48 ч
            - generic [ref=e43]: 7 дней
        - generic [ref=e44]:
          - paragraph [ref=e45]:
            - generic [ref=e46]: 17°
            - generic [ref=e47]: малооблачно
            - generic [ref=e48]: 1027 гПа ↑
            - generic [ref=e49]: ветер СВ 1 м/с
            - generic [ref=e50]: восход 06:51, закат 19:06
            - generic [ref=e51]: растущая луна
          - generic "Давление за трое суток" [ref=e52]:
            - img "Давление за 72 часа" [ref=e53]
            - generic [ref=e55]: давление, 72 ч
          - 'button "Происхождение данных: измерено" [ref=e57] [cursor=pointer]': измерено
        - heading "Куда ехать" [level=2] [ref=e58]
        - list [ref=e59]:
          - listitem [ref=e60]:
            - button "шанс 81 Омь у Калачинска Омь 1 ч 32 мин щука лучше 15:00–22:00" [ref=e61] [cursor=pointer]:
              - generic "шанс 81" [ref=e62]: "81"
              - generic [ref=e63]:
                - text: Омь у Калачинска
                - generic [ref=e64]:
                  - generic [ref=e65]: Омь
                  - generic [ref=e66]: 1 ч 32 мин
                  - generic [ref=e67]: щука
                  - generic [ref=e68]: лучше 15:00–22:00
              - generic [aria-hidden] [ref=e69]: ›
          - listitem [ref=e70]:
            - button "шанс 81 Тугочайка у Заречного Тугочайка 3 ч 1 мин щука лучше 15:00–22:00" [ref=e71] [cursor=pointer]:
              - generic "шанс 81" [ref=e72]: "81"
              - generic [ref=e73]:
                - text: Тугочайка у Заречного
                - generic [ref=e74]:
                  - generic [ref=e75]: Тугочайка
                  - generic [ref=e76]: 3 ч 1 мин
                  - generic [ref=e77]: щука
                  - generic [ref=e78]: лучше 15:00–22:00
              - generic [aria-hidden] [ref=e79]: ›
          - listitem [ref=e80]:
            - button "шанс 79 Озеро Ик у Китермы Ик 3 ч 16 мин окунь лучше 05:00–11:00" [ref=e81] [cursor=pointer]:
              - generic "шанс 79" [ref=e82]: "79"
              - generic [ref=e83]:
                - text: Озеро Ик у Китермы
                - generic [ref=e84]:
                  - generic [ref=e85]: Ик
                  - generic [ref=e86]: 3 ч 16 мин
                  - generic [ref=e87]: окунь
                  - generic [ref=e88]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e89]: ›
          - listitem [ref=e90]:
            - button "шанс 77 Затон «Лампочка» (Бородино) Иртыш, затон «Лампочка» 14 мин щука лучше 05:00–11:00" [ref=e91] [cursor=pointer]:
              - generic "шанс 77" [ref=e92]: "77"
              - generic [ref=e93]:
                - text: Затон «Лампочка» (Бородино)
                - generic [ref=e94]:
                  - generic [ref=e95]: Иртыш, затон «Лампочка»
                  - generic [ref=e96]: 14 мин
                  - generic [ref=e97]: щука
                  - generic [ref=e98]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e99]: ›
          - listitem [ref=e100]:
            - button "шанс 77 Камышловка у Дружино Камышловка 31 мин щука лучше 05:00–11:00" [ref=e101] [cursor=pointer]:
              - generic "шанс 77" [ref=e102]: "77"
              - generic [ref=e103]:
                - text: Камышловка у Дружино
                - generic [ref=e104]:
                  - generic [ref=e105]: Камышловка
                  - generic [ref=e106]: 31 мин
                  - generic [ref=e107]: щука
                  - generic [ref=e108]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e109]: ›
          - listitem [ref=e110]:
            - button "шанс 77 Усть-Заостровка и Падь — Иртыш Иртыш 39 мин щука лучше 05:00–11:00" [ref=e111] [cursor=pointer]:
              - generic "шанс 77" [ref=e112]: "77"
              - generic [ref=e113]:
                - text: Усть-Заостровка и Падь — Иртыш
                - generic [ref=e114]:
                  - generic [ref=e115]: Иртыш
                  - generic [ref=e116]: 39 мин
                  - generic [ref=e117]: щука
                  - generic [ref=e118]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e119]: ›
          - listitem [ref=e120]:
            - button "шанс 77 Красная Горка — Иртыш Иртыш 45 мин щука лучше 05:00–11:00" [ref=e121] [cursor=pointer]:
              - generic "шанс 77" [ref=e122]: "77"
              - generic [ref=e123]:
                - text: Красная Горка — Иртыш
                - generic [ref=e124]:
                  - generic [ref=e125]: Иртыш
                  - generic [ref=e126]: 45 мин
                  - generic [ref=e127]: щука
                  - generic [ref=e128]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e129]: ›
          - listitem [ref=e130]:
            - button "шанс 77 Красноярка — Иртыш Иртыш 49 мин щука лучше 05:00–11:00" [ref=e131] [cursor=pointer]:
              - generic "шанс 77" [ref=e132]: "77"
              - generic [ref=e133]:
                - text: Красноярка — Иртыш
                - generic [ref=e134]:
                  - generic [ref=e135]: Иртыш
                  - generic [ref=e136]: 49 мин
                  - generic [ref=e137]: щука
                  - generic [ref=e138]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e139]: ›
          - listitem [ref=e140]:
            - button "шанс 77 Иртыш и затон у Лежанки Иртыш 1 ч 23 мин щука лучше 16:00–22:00" [ref=e141] [cursor=pointer]:
              - generic "шанс 77" [ref=e142]: "77"
              - generic [ref=e143]:
                - text: Иртыш и затон у Лежанки
                - generic [ref=e144]:
                  - generic [ref=e145]: Иртыш
                  - generic [ref=e146]: 1 ч 23 мин
                  - generic [ref=e147]: щука
                  - generic [ref=e148]: лучше 16:00–22:00
              - generic [aria-hidden] [ref=e149]: ›
          - listitem [ref=e150]:
            - button "шанс 77 Харламово — Иртыш (левый берег) Иртыш 1 ч 29 мин щука лучше 05:00–11:00" [ref=e151] [cursor=pointer]:
              - generic "шанс 77" [ref=e152]: "77"
              - generic [ref=e153]:
                - text: Харламово — Иртыш (левый берег)
                - generic [ref=e154]:
                  - generic [ref=e155]: Иртыш
                  - generic [ref=e156]: 1 ч 29 мин
                  - generic [ref=e157]: щука
                  - generic [ref=e158]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e159]: ›
          - listitem [ref=e160]:
            - button "шанс 77 Озеро Жилое (Бития) у Увальной Битии Жилое 1 ч 29 мин щука лучше 16:00–22:00" [ref=e161] [cursor=pointer]:
              - generic "шанс 77" [ref=e162]: "77"
              - generic [ref=e163]:
                - text: Озеро Жилое (Бития) у Увальной Битии
                - generic [ref=e164]:
                  - generic [ref=e165]: Жилое
                  - generic [ref=e166]: 1 ч 29 мин
                  - generic [ref=e167]: щука
                  - generic [ref=e168]: лучше 16:00–22:00
              - generic [aria-hidden] [ref=e169]: ›
          - listitem [ref=e170]:
            - button "шанс 77 Иртыш и Решетниковская старица у Большеречья Иртыш 2 ч 59 мин щука лучше 05:00–11:00" [ref=e171] [cursor=pointer]:
              - generic "шанс 77" [ref=e172]: "77"
              - generic [ref=e173]:
                - text: Иртыш и Решетниковская старица у Большеречья
                - generic [ref=e174]:
                  - generic [ref=e175]: Иртыш
                  - generic [ref=e176]: 2 ч 59 мин
                  - generic [ref=e177]: щука
                  - generic [ref=e178]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e179]: ›
          - listitem [ref=e180]:
            - button "шанс 77 Озеро Черталы у Приозёрки Черталы 3 ч 1 мин щука лучше 05:00–11:00" [ref=e181] [cursor=pointer]:
              - generic "шанс 77" [ref=e182]: "77"
              - generic [ref=e183]:
                - text: Озеро Черталы у Приозёрки
                - generic [ref=e184]:
                  - generic [ref=e185]: Черталы
                  - generic [ref=e186]: 3 ч 1 мин
                  - generic [ref=e187]: щука
                  - generic [ref=e188]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e189]: ›
          - listitem [ref=e190]:
            - button "шанс 77 Река Тара у Муромцево Тара 3 ч 7 мин щука лучше 15:00–21:00" [ref=e191] [cursor=pointer]:
              - generic "шанс 77" [ref=e192]: "77"
              - generic [ref=e193]:
                - text: Река Тара у Муромцево
                - generic [ref=e194]:
                  - generic [ref=e195]: Тара
                  - generic [ref=e196]: 3 ч 7 мин
                  - generic [ref=e197]: щука
                  - generic [ref=e198]: лучше 15:00–21:00
              - generic [aria-hidden] [ref=e199]: ›
          - listitem [ref=e200]:
            - button "шанс 77 Оша у Колосовки Оша 3 ч 55 мин щука лучше 05:00–11:00" [ref=e201] [cursor=pointer]:
              - generic "шанс 77" [ref=e202]: "77"
              - generic [ref=e203]:
                - text: Оша у Колосовки
                - generic [ref=e204]:
                  - generic [ref=e205]: Оша
                  - generic [ref=e206]: 3 ч 55 мин
                  - generic [ref=e207]: щука
                  - generic [ref=e208]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e209]: ›
          - listitem [ref=e210]:
            - button "шанс 76 Омь у Сыропятского Омь 39 мин щука лучше 15:00–21:00" [ref=e211] [cursor=pointer]:
              - generic "шанс 76" [ref=e212]: "76"
              - generic [ref=e213]:
                - text: Омь у Сыропятского
                - generic [ref=e214]:
                  - generic [ref=e215]: Омь
                  - generic [ref=e216]: 39 мин
                  - generic [ref=e217]: щука
                  - generic [ref=e218]: лучше 15:00–21:00
              - generic [aria-hidden] [ref=e219]: ›
          - listitem [ref=e220]:
            - button "шанс 76 Омь у Кормиловки Омь 52 мин щука лучше 15:00–21:00" [ref=e221] [cursor=pointer]:
              - generic "шанс 76" [ref=e222]: "76"
              - generic [ref=e223]:
                - text: Омь у Кормиловки
                - generic [ref=e224]:
                  - generic [ref=e225]: Омь
                  - generic [ref=e226]: 52 мин
                  - generic [ref=e227]: щука
                  - generic [ref=e228]: лучше 15:00–21:00
              - generic [aria-hidden] [ref=e229]: ›
          - listitem [ref=e230]:
            - button "шанс 76 Верхнеильинка — Иртыш Иртыш 1 ч 25 мин щука лучше 15:00–22:00" [ref=e231] [cursor=pointer]:
              - generic "шанс 76" [ref=e232]: "76"
              - generic [ref=e233]:
                - text: Верхнеильинка — Иртыш
                - generic [ref=e234]:
                  - generic [ref=e235]: Иртыш
                  - generic [ref=e236]: 1 ч 25 мин
                  - generic [ref=e237]: щука
                  - generic [ref=e238]: лучше 15:00–22:00
              - generic [aria-hidden] [ref=e239]: ›
          - listitem [ref=e240]:
            - button "шанс 76 Посёлок Иртыш — Иртыш Иртыш 1 ч 33 мин щука лучше 15:00–22:00" [ref=e241] [cursor=pointer]:
              - generic "шанс 76" [ref=e242]: "76"
              - generic [ref=e243]:
                - text: Посёлок Иртыш — Иртыш
                - generic [ref=e244]:
                  - generic [ref=e245]: Иртыш
                  - generic [ref=e246]: 1 ч 33 мин
                  - generic [ref=e247]: щука
                  - generic [ref=e248]: лучше 15:00–22:00
              - generic [aria-hidden] [ref=e249]: ›
          - listitem [ref=e250]:
            - button "шанс 76 Ачаир — Иртыш, устье Ачаирки и Ильинские озёра Иртыш 1 ч 47 мин щука лучше 15:00–22:00" [ref=e251] [cursor=pointer]:
              - generic "шанс 76" [ref=e252]: "76"
              - generic [ref=e253]:
                - text: Ачаир — Иртыш, устье Ачаирки и Ильинские озёра
                - generic [ref=e254]:
                  - generic [ref=e255]: Иртыш
                  - generic [ref=e256]: 1 ч 47 мин
                  - generic [ref=e257]: щука
                  - generic [ref=e258]: лучше 15:00–22:00
              - generic [aria-hidden] [ref=e259]: ›
          - listitem [ref=e260]:
            - button "шанс 75 Озеро Круглое и протока у Верблюжьего Круглое 1 ч 16 мин окунь лучше 16:00–21:00" [ref=e261] [cursor=pointer]:
              - generic "шанс 75" [ref=e262]: "75"
              - generic [ref=e263]:
                - text: Озеро Круглое и протока у Верблюжьего
                - generic [ref=e264]:
                  - generic [ref=e265]: Круглое
                  - generic [ref=e266]: 1 ч 16 мин
                  - generic [ref=e267]: окунь
                  - generic [ref=e268]: лучше 16:00–21:00
              - generic [aria-hidden] [ref=e269]: ›
          - listitem [ref=e270]:
            - button "шанс 75 Река Сухокарасук у Бызовки Сухокарасук 3 ч 9 мин окунь лучше 05:00–11:00" [ref=e271] [cursor=pointer]:
              - generic "шанс 75" [ref=e272]: "75"
              - generic [ref=e273]:
                - text: Река Сухокарасук у Бызовки
                - generic [ref=e274]:
                  - generic [ref=e275]: Сухокарасук
                  - generic [ref=e276]: 3 ч 9 мин
                  - generic [ref=e277]: окунь
                  - generic [ref=e278]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e279]: ›
          - listitem [ref=e280]:
            - button "шанс 74 Черлак — старица и затон на южной окраине Старый Иртыш (старица у Черлака) 2 ч 25 мин окунь лучше 15:00–21:00" [ref=e281] [cursor=pointer]:
              - generic "шанс 74" [ref=e282]: "74"
              - generic [ref=e283]:
                - text: Черлак — старица и затон на южной окраине
                - generic [ref=e284]:
                  - generic [ref=e285]: Старый Иртыш (старица у Черлака)
                  - generic [ref=e286]: 2 ч 25 мин
                  - generic [ref=e287]: окунь
                  - generic [ref=e288]: лучше 15:00–21:00
              - generic [aria-hidden] [ref=e289]: ›
          - listitem [ref=e290]:
            - button "шанс 74 Озеро Салтаим Салтаим 3 ч 37 мин окунь лучше 06:00–11:00" [ref=e291] [cursor=pointer]:
              - generic "шанс 74" [ref=e292]: "74"
              - generic [ref=e293]:
                - text: Озеро Салтаим
                - generic [ref=e294]:
                  - generic [ref=e295]: Салтаим
                  - generic [ref=e296]: 3 ч 37 мин
                  - generic [ref=e297]: окунь
                  - generic [ref=e298]: лучше 06:00–11:00
              - generic [aria-hidden] [ref=e299]: ›
          - listitem [ref=e300]:
            - button "шанс 73 Озеро Жалтыр (Шербакуль) Жалтыр 1 ч 28 мин карась серебряный лучше 05:00–08:00" [ref=e301] [cursor=pointer]:
              - generic "шанс 73" [ref=e302]: "73"
              - generic [ref=e303]:
                - text: Озеро Жалтыр (Шербакуль)
                - generic [ref=e304]:
                  - generic [ref=e305]: Жалтыр
                  - generic [ref=e306]: 1 ч 28 мин
                  - generic [ref=e307]: карась серебряный
                  - generic [ref=e308]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e309]: ›
          - listitem [ref=e310]:
            - button "шанс 73 Озеро Калыкуль Калыкуль 4 ч 17 мин карась серебряный лучше 05:00–08:00" [ref=e311] [cursor=pointer]:
              - generic "шанс 73" [ref=e312]: "73"
              - generic [ref=e313]:
                - text: Озеро Калыкуль
                - generic [ref=e314]:
                  - generic [ref=e315]: Калыкуль
                  - generic [ref=e316]: 4 ч 17 мин
                  - generic [ref=e317]: карась серебряный
                  - generic [ref=e318]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e319]: ›
          - listitem [ref=e320]:
            - button "шанс 72 Надеждинская старица (Кулачье) Старица Кулачье 33 мин щука лучше 05:00–11:00" [ref=e321] [cursor=pointer]:
              - generic "шанс 72" [ref=e322]: "72"
              - generic [ref=e323]:
                - text: Надеждинская старица (Кулачье)
                - generic [ref=e324]:
                  - generic [ref=e325]: Старица Кулачье
                  - generic [ref=e326]: 33 мин
                  - generic [ref=e327]: щука
                  - generic [ref=e328]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e329]: ›
          - listitem [ref=e330]:
            - button "шанс 72 Розовка — Иртыш (высокий правый берег) Иртыш 46 мин щука лучше 05:00–11:00" [ref=e331] [cursor=pointer]:
              - generic "шанс 72" [ref=e332]: "72"
              - generic [ref=e333]:
                - text: Розовка — Иртыш (высокий правый берег)
                - generic [ref=e334]:
                  - generic [ref=e335]: Иртыш
                  - generic [ref=e336]: 46 мин
                  - generic [ref=e337]: щука
                  - generic [ref=e338]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e339]: ›
          - listitem [ref=e340]:
            - button "шанс 72 Озеро Райнфельд (Марьяновский район) Райнфельд 1 ч 28 мин щука лучше 05:00–11:00" [ref=e341] [cursor=pointer]:
              - generic "шанс 72" [ref=e342]: "72"
              - generic [ref=e343]:
                - text: Озеро Райнфельд (Марьяновский район)
                - generic [ref=e344]:
                  - generic [ref=e345]: Райнфельд
                  - generic [ref=e346]: 1 ч 28 мин
                  - generic [ref=e347]: щука
                  - generic [ref=e348]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e349]: ›
          - listitem [ref=e350]:
            - button "шанс 72 Оша у Кутырлов Оша 2 ч 58 мин щука лучше 17:00–21:00" [ref=e351] [cursor=pointer]:
              - generic "шанс 72" [ref=e352]: "72"
              - generic [ref=e353]:
                - text: Оша у Кутырлов
                - generic [ref=e354]:
                  - generic [ref=e355]: Оша
                  - generic [ref=e356]: 2 ч 58 мин
                  - generic [ref=e357]: щука
                  - generic [ref=e358]: лучше 17:00–21:00
              - generic [aria-hidden] [ref=e359]: ›
          - listitem [ref=e360]:
            - button "шанс 72 Озеро Ик у Калачиков Ик 3 ч 8 мин окунь лучше 06:00–11:00" [ref=e361] [cursor=pointer]:
              - generic "шанс 72" [ref=e362]: "72"
              - generic [ref=e363]:
                - text: Озеро Ик у Калачиков
                - generic [ref=e364]:
                  - generic [ref=e365]: Ик
                  - generic [ref=e366]: 3 ч 8 мин
                  - generic [ref=e367]: окунь
                  - generic [ref=e368]: лучше 06:00–11:00
              - generic [aria-hidden] [ref=e369]: ›
          - listitem [ref=e370]:
            - button "шанс 71 Корниловская балка (платник) пруд Корниловская балка 50 мин сазан / карп лучше 18:00–23:00 платно" [ref=e371] [cursor=pointer]:
              - generic "шанс 71" [ref=e372]: "71"
              - generic [ref=e373]:
                - text: Корниловская балка (платник)
                - generic [ref=e374]:
                  - generic [ref=e375]: пруд Корниловская балка
                  - generic [ref=e376]: 50 мин
                  - generic [ref=e377]: сазан / карп
                  - generic [ref=e378]: лучше 18:00–23:00
                  - generic [ref=e379]: платно
              - generic [aria-hidden] [ref=e380]: ›
          - listitem [ref=e381]:
            - button "шанс 71 Иртыш у Серебряного Иртыш 2 ч 12 мин щука лучше 15:00–22:00" [ref=e382] [cursor=pointer]:
              - generic "шанс 71" [ref=e383]: "71"
              - generic [ref=e384]:
                - text: Иртыш у Серебряного
                - generic [ref=e385]:
                  - generic [ref=e386]: Иртыш
                  - generic [ref=e387]: 2 ч 12 мин
                  - generic [ref=e388]: щука
                  - generic [ref=e389]: лучше 15:00–22:00
              - generic [aria-hidden] [ref=e390]: ›
          - listitem [ref=e391]:
            - button "шанс 70 Иртыш у телецентра (правый берег, набережная) Иртыш 12 мин окунь лучше 06:00–11:00" [ref=e392] [cursor=pointer]:
              - generic "шанс 70" [ref=e393]: "70"
              - generic [ref=e394]:
                - text: Иртыш у телецентра (правый берег, набережная)
                - generic [ref=e395]:
                  - generic [ref=e396]: Иртыш
                  - generic [ref=e397]: 12 мин
                  - generic [ref=e398]: окунь
                  - generic [ref=e399]: лучше 06:00–11:00
              - generic [aria-hidden] [ref=e400]: ›
          - listitem [ref=e401]:
            - button "шанс 70 Новоомский затон Иртыш, Новоомский затон 29 мин окунь лучше 06:00–11:00" [ref=e402] [cursor=pointer]:
              - generic "шанс 70" [ref=e403]: "70"
              - generic [ref=e404]:
                - text: Новоомский затон
                - generic [ref=e405]:
                  - generic [ref=e406]: Иртыш, Новоомский затон
                  - generic [ref=e407]: 29 мин
                  - generic [ref=e408]: окунь
                  - generic [ref=e409]: лучше 06:00–11:00
              - generic [aria-hidden] [ref=e410]: ›
          - listitem [ref=e411]:
            - button "шанс 70 Озеро Изюк Озеро Изюк 5 ч 19 мин окунь лучше 06:00–11:00" [ref=e412] [cursor=pointer]:
              - generic "шанс 70" [ref=e413]: "70"
              - generic [ref=e414]:
                - text: Озеро Изюк
                - generic [ref=e415]:
                  - generic [ref=e416]: Озеро Изюк
                  - generic [ref=e417]: 5 ч 19 мин
                  - generic [ref=e418]: окунь
                  - generic [ref=e419]: лучше 06:00–11:00
              - generic [aria-hidden] [ref=e420]: ›
          - listitem [ref=e421]:
            - button "шанс 69 Омь в черте Омска (район ул. Штанина) Омь 14 мин карась серебряный лучше 05:00–08:00" [ref=e422] [cursor=pointer]:
              - generic "шанс 69" [ref=e423]: "69"
              - generic [ref=e424]:
                - text: Омь в черте Омска (район ул. Штанина)
                - generic [ref=e425]:
                  - generic [ref=e426]: Омь
                  - generic [ref=e427]: 14 мин
                  - generic [ref=e428]: карась серебряный
                  - generic [ref=e429]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e430]: ›
          - listitem [ref=e431]:
            - button "шанс 69 Луговое — Иртыш Иртыш 1 ч 40 мин лещ лучше 18:00–23:00" [ref=e432] [cursor=pointer]:
              - generic "шанс 69" [ref=e433]: "69"
              - generic [ref=e434]:
                - text: Луговое — Иртыш
                - generic [ref=e435]:
                  - generic [ref=e436]: Иртыш
                  - generic [ref=e437]: 1 ч 40 мин
                  - generic [ref=e438]: лещ
                  - generic [ref=e439]: лучше 18:00–23:00
              - generic [aria-hidden] [ref=e440]: ›
          - listitem [ref=e441]:
            - button "шанс 69 Пруд на Саргатке в Саргатском Саргатка 1 ч 42 мин карась серебряный лучше 05:00–08:00" [ref=e442] [cursor=pointer]:
              - generic "шанс 69" [ref=e443]: "69"
              - generic [ref=e444]:
                - text: Пруд на Саргатке в Саргатском
                - generic [ref=e445]:
                  - generic [ref=e446]: Саргатка
                  - generic [ref=e447]: 1 ч 42 мин
                  - generic [ref=e448]: карась серебряный
                  - generic [ref=e449]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e450]: ›
          - listitem [ref=e451]:
            - button "шанс 69 Озеро Тобол-Кушлы озеро Тобол-Кушлы 2 ч 41 мин карась серебряный лучше 05:00–08:00" [ref=e452] [cursor=pointer]:
              - generic "шанс 69" [ref=e453]: "69"
              - generic [ref=e454]:
                - text: Озеро Тобол-Кушлы
                - generic [ref=e455]:
                  - generic [ref=e456]: озеро Тобол-Кушлы
                  - generic [ref=e457]: 2 ч 41 мин
                  - generic [ref=e458]: карась серебряный
                  - generic [ref=e459]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e460]: ›
          - listitem [ref=e461]:
            - button "шанс 69 Озеро Тюкалинское озеро Тюкалинское 3 ч 3 мин карась серебряный лучше 05:00–08:00" [ref=e462] [cursor=pointer]:
              - generic "шанс 69" [ref=e463]: "69"
              - generic [ref=e464]:
                - text: Озеро Тюкалинское
                - generic [ref=e465]:
                  - generic [ref=e466]: озеро Тюкалинское
                  - generic [ref=e467]: 3 ч 3 мин
                  - generic [ref=e468]: карась серебряный
                  - generic [ref=e469]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e470]: ›
          - listitem [ref=e471]:
            - button "шанс 69 Такмыкская старица Такмыкская старица 3 ч 21 мин карась серебряный лучше 05:00–08:00" [ref=e472] [cursor=pointer]:
              - generic "шанс 69" [ref=e473]: "69"
              - generic [ref=e474]:
                - text: Такмыкская старица
                - generic [ref=e475]:
                  - generic [ref=e476]: Такмыкская старица
                  - generic [ref=e477]: 3 ч 21 мин
                  - generic [ref=e478]: карась серебряный
                  - generic [ref=e479]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e480]: ›
          - listitem [ref=e481]:
            - button "шанс 69 Амринская балка (Платово) Амринская балка 3 ч 32 мин карась серебряный лучше 06:00–08:00" [ref=e482] [cursor=pointer]:
              - generic "шанс 69" [ref=e483]: "69"
              - generic [ref=e484]:
                - text: Амринская балка (Платово)
                - generic [ref=e485]:
                  - generic [ref=e486]: Амринская балка
                  - generic [ref=e487]: 3 ч 32 мин
                  - generic [ref=e488]: карась серебряный
                  - generic [ref=e489]: лучше 06:00–08:00
              - generic [aria-hidden] [ref=e490]: ›
          - listitem [ref=e491]:
            - button "шанс 68 Озеро Чередовое Чередовое 20 мин окунь лучше 06:00–11:00" [ref=e492] [cursor=pointer]:
              - generic "шанс 68" [ref=e493]: "68"
              - generic [ref=e494]:
                - text: Озеро Чередовое
                - generic [ref=e495]:
                  - generic [ref=e496]: Чередовое
                  - generic [ref=e497]: 20 мин
                  - generic [ref=e498]: окунь
                  - generic [ref=e499]: лучше 06:00–11:00
              - generic [aria-hidden] [ref=e500]: ›
          - listitem [ref=e501]:
            - button "шанс 68 Озеро Тенис у Усть-Логатки Тенис 3 ч 36 мин окунь лучше 06:00–11:00" [ref=e502] [cursor=pointer]:
              - generic "шанс 68" [ref=e503]: "68"
              - generic [ref=e504]:
                - text: Озеро Тенис у Усть-Логатки
                - generic [ref=e505]:
                  - generic [ref=e506]: Тенис
                  - generic [ref=e507]: 3 ч 36 мин
                  - generic [ref=e508]: окунь
                  - generic [ref=e509]: лучше 06:00–11:00
              - generic [aria-hidden] [ref=e510]: ›
          - listitem [ref=e511]:
            - button "шанс 67 Карпятник «Озеро Карпятник» (пос. Степной, восточный выезд) озеро Карпятник 18 мин сазан / карп лучше 18:00–23:00 платно" [ref=e512] [cursor=pointer]:
              - generic "шанс 67" [ref=e513]: "67"
              - generic [ref=e514]:
                - text: Карпятник «Озеро Карпятник» (пос. Степной, восточный выезд)
                - generic [ref=e515]:
                  - generic [ref=e516]: озеро Карпятник
                  - generic [ref=e517]: 18 мин
                  - generic [ref=e518]: сазан / карп
                  - generic [ref=e519]: лучше 18:00–23:00
                  - generic [ref=e520]: платно
              - generic [aria-hidden] [ref=e521]: ›
          - listitem [ref=e522]:
            - button "шанс 67 Карпятник у Порт-Артура (выезд по ул. Воровского) пруд у СНТ «Энергетик-1» 19 мин сазан / карп лучше 04:00–08:00 платно" [ref=e523] [cursor=pointer]:
              - generic "шанс 67" [ref=e524]: "67"
              - generic [ref=e525]:
                - text: Карпятник у Порт-Артура (выезд по ул. Воровского)
                - generic [ref=e526]:
                  - generic [ref=e527]: пруд у СНТ «Энергетик-1»
                  - generic [ref=e528]: 19 мин
                  - generic [ref=e529]: сазан / карп
                  - generic [ref=e530]: лучше 04:00–08:00
                  - generic [ref=e531]: платно
              - generic [aria-hidden] [ref=e532]: ›
          - listitem [ref=e533]:
            - button "шанс 67 Николаевка (Нефтяники) — Иртыш Иртыш 22 мин щука лучше 05:00–11:00" [ref=e534] [cursor=pointer]:
              - generic "шанс 67" [ref=e535]: "67"
              - generic [ref=e536]:
                - text: Николаевка (Нефтяники) — Иртыш
                - generic [ref=e537]:
                  - generic [ref=e538]: Иртыш
                  - generic [ref=e539]: 22 мин
                  - generic [ref=e540]: щука
                  - generic [ref=e541]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e542]: ›
          - listitem [ref=e543]:
            - button "шанс 67 Карпятник Иртышский пруд в посёлке Иртышский 34 мин сазан / карп лучше 18:00–23:00 платно" [ref=e544] [cursor=pointer]:
              - generic "шанс 67" [ref=e545]: "67"
              - generic [ref=e546]:
                - text: Карпятник Иртышский
                - generic [ref=e547]:
                  - generic [ref=e548]: пруд в посёлке Иртышский
                  - generic [ref=e549]: 34 мин
                  - generic [ref=e550]: сазан / карп
                  - generic [ref=e551]: лучше 18:00–23:00
                  - generic [ref=e552]: платно
              - generic [aria-hidden] [ref=e553]: ›
          - listitem [ref=e554]:
            - button "шанс 67 Черёмушки — Иртыш у водозабора Иртыш 39 мин щука лучше 05:00–11:00" [ref=e555] [cursor=pointer]:
              - generic "шанс 67" [ref=e556]: "67"
              - generic [ref=e557]:
                - text: Черёмушки — Иртыш у водозабора
                - generic [ref=e558]:
                  - generic [ref=e559]: Иртыш
                  - generic [ref=e560]: 39 мин
                  - generic [ref=e561]: щука
                  - generic [ref=e562]: лучше 05:00–11:00
              - generic [aria-hidden] [ref=e563]: ›
          - listitem [ref=e564]:
            - button "шанс 67 Карпятник в Азово пруд у Азово (дорога на Сосновку) 52 мин сазан / карп лучше 04:00–08:00 платно" [ref=e565] [cursor=pointer]:
              - generic "шанс 67" [ref=e566]: "67"
              - generic [ref=e567]:
                - text: Карпятник в Азово
                - generic [ref=e568]:
                  - generic [ref=e569]: пруд у Азово (дорога на Сосновку)
                  - generic [ref=e570]: 52 мин
                  - generic [ref=e571]: сазан / карп
                  - generic [ref=e572]: лучше 04:00–08:00
                  - generic [ref=e573]: платно
              - generic [aria-hidden] [ref=e574]: ›
          - listitem [ref=e575]:
            - button "шанс 67 Чернолучье — Иртыш Иртыш 1 ч плотва лучше 05:00–10:00" [ref=e576] [cursor=pointer]:
              - generic "шанс 67" [ref=e577]: "67"
              - generic [ref=e578]:
                - text: Чернолучье — Иртыш
                - generic [ref=e579]:
                  - generic [ref=e580]: Иртыш
                  - generic [ref=e581]: 1 ч
                  - generic [ref=e582]: плотва
                  - generic [ref=e583]: лучше 05:00–10:00
              - generic [aria-hidden] [ref=e584]: ›
          - listitem [ref=e585]:
            - button "шанс 67 Иртыш у Артына Иртыш 3 ч 5 мин сазан / карп лучше 04:00–08:00" [ref=e586] [cursor=pointer]:
              - generic "шанс 67" [ref=e587]: "67"
              - generic [ref=e588]:
                - text: Иртыш у Артына
                - generic [ref=e589]:
                  - generic [ref=e590]: Иртыш
                  - generic [ref=e591]: 3 ч 5 мин
                  - generic [ref=e592]: сазан / карп
                  - generic [ref=e593]: лучше 04:00–08:00
              - generic [aria-hidden] [ref=e594]: ›
          - listitem [ref=e595]:
            - button "шанс 65 Посёлок Рыбачий — Иртыш (левый берег) Иртыш 8 мин лещ лучше 18:00–23:00" [ref=e596] [cursor=pointer]:
              - generic "шанс 65" [ref=e597]: "65"
              - generic [ref=e598]:
                - text: Посёлок Рыбачий — Иртыш (левый берег)
                - generic [ref=e599]:
                  - generic [ref=e600]: Иртыш
                  - generic [ref=e601]: 8 мин
                  - generic [ref=e602]: лещ
                  - generic [ref=e603]: лучше 18:00–23:00
              - generic [aria-hidden] [ref=e604]: ›
          - listitem [ref=e605]:
            - button "шанс 62 Большой Атмас — Иртыш Иртыш 2 ч 26 мин лещ лучше 18:00–23:00" [ref=e606] [cursor=pointer]:
              - generic "шанс 62" [ref=e607]: "62"
              - generic [ref=e608]:
                - text: Большой Атмас — Иртыш
                - generic [ref=e609]:
                  - generic [ref=e610]: Иртыш
                  - generic [ref=e611]: 2 ч 26 мин
                  - generic [ref=e612]: лещ
                  - generic [ref=e613]: лучше 18:00–23:00
              - generic [aria-hidden] [ref=e614]: ›
          - listitem [ref=e615]:
            - button "шанс 57 Озеро Шайтан у Окунево Озеро Шайтан 4 ч 18 мин карась серебряный лучше 05:00–08:00" [ref=e616] [cursor=pointer]:
              - generic "шанс 57" [ref=e617]: "57"
              - generic [ref=e618]:
                - text: Озеро Шайтан у Окунево
                - generic [ref=e619]:
                  - generic [ref=e620]: Озеро Шайтан
                  - generic [ref=e621]: 4 ч 18 мин
                  - generic [ref=e622]: карась серебряный
                  - generic [ref=e623]: лучше 05:00–08:00
              - generic [aria-hidden] [ref=e624]: ›
  - navigation "Разделы" [ref=e625]:
    - link "Карта" [ref=e626] [cursor=pointer]:
      - /url: /
    - link "План" [ref=e630] [cursor=pointer]:
      - /url: /plan
    - link "Рыбы" [ref=e634] [cursor=pointer]:
      - /url: /species
    - link "Правила" [ref=e638] [cursor=pointer]:
      - /url: /rules
```

# Test source

```ts
  1   | /**
  2   |  * The six jobs from BRIEF §1, on mobile and desktop. Screenshots go to qa/screenshots/.
  3   |  */
  4   | import { test, expect, type Page } from '@playwright/test';
  5   | 
  6   | const shot = (page: Page, name: string) => page.screenshot({ path: `qa/screenshots/${test.info().project.name}-${name}.png`, fullPage: false });
  7   | 
  8   | test.beforeEach(async ({ page }) => {
  9   |   // Block third-party weather so runs are deterministic and offline-friendly; the app must degrade gracefully.
  10  |   await page.route(/open-meteo\.com/, (r) => r.abort());
  11  | });
  12  | 
  13  | test('1. map loads with chance-colored spots and a verdict', async ({ page }) => {
  14  |   await page.goto('/');
  15  |   await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  16  |   await expect(page.locator('.mapscreen__verdict')).not.toHaveText(/Загружаем/, { timeout: 20_000 });
  17  |   await expect(page.locator('.rows .row-btn').first()).toBeVisible();
  18  |   await shot(page, '01-map');
  19  | });
  20  | 
  21  | test('2. filter by щука recolors and lists spots', async ({ page }) => {
  22  |   await page.goto('/');
  23  |   await page.getByRole('button', { name: /Любая рыба/ }).click();
  24  |   await page.getByRole('button', { name: 'Щука', exact: true }).click();
  25  |   await expect(page.locator('.mapscreen__verdict')).toContainText(/Щука/);
  26  |   await shot(page, '02-filter-pike');
  27  | });
  28  | 
  29  | test('3. open a spot: verdict, species row, rules tab reflects today', async ({ page }) => {
  30  |   await page.goto('/');
  31  |   await page.locator('.rows .row-btn').first().click();
  32  |   await expect(page.locator('.ss__title')).toBeVisible();
  33  |   await expect(page.locator('.verdict__num')).toBeVisible();
  34  |   await page.getByRole('tab', { name: 'Правила сегодня' }).click();
  35  |   await expect(page.locator('.rules-today .callout').first()).toBeVisible();
  36  |   await shot(page, '03-spot');
  37  | });
  38  | 
  39  | test('4. species page has photo credit, month bar and edibility', async ({ page }) => {
  40  |   await page.goto('/species/esox-lucius');
  41  |   await expect(page.locator('h1')).toContainText('Щука');
  42  |   await expect(page.locator('.mb__bars')).toBeVisible();
  43  |   await expect(page.getByText(/Описторхоз/).first()).toBeVisible();
  44  |   await expect(page.getByText(/Фото:/)).toBeVisible();
  45  |   await shot(page, '04-species');
  46  | });
  47  | 
  48  | test('5. planner ranks spots for Saturday', async ({ page }) => {
  49  |   await page.goto('/plan?fish=esox-lucius&when=sat&min=120');
  50  |   await expect(page.locator('.plan__list li').first()).toBeVisible({ timeout: 20_000 });
  51  |   await expect(page.locator('.plan__verdict')).toContainText(/щука/i);
  52  |   await shot(page, '05-plan');
  53  | });
  54  | 
  55  | test('6. rules and safety are readable and dated', async ({ page }) => {
  56  |   await page.goto('/rules');
  57  |   await expect(page.getByText(/редакция \d{2}\.\d{2}\.\d{4}/)).toBeVisible();
  58  |   await page.getByRole('button', { name: 'Безопасность' }).click();
  59  |   await expect(page.getByRole('heading', { name: /Лёд/ })).toBeVisible();
  60  |   await shot(page, '06-rules');
  61  | });
  62  | 
  63  | test('7. offline: app still opens with cached data', async ({ page, context }) => {
  64  |   await page.goto('/');
  65  |   await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  66  |   // Let the service worker install and precache.
  67  |   await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 30_000 }).catch(() => {});
  68  |   await page.waitForTimeout(1500);
  69  |   await context.setOffline(true);
  70  |   await page.reload();
  71  |   await expect(page.locator('.tabbar')).toBeVisible({ timeout: 20_000 });
  72  |   await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  73  |   await context.setOffline(false);
  74  |   await shot(page, '07-offline');
  75  | });
  76  | 
  77  | test('8. search finds a spot and a fish', async ({ page }) => {
  78  |   await page.goto('/');
  79  |   await page.getByRole('button', { name: 'Поиск мест, водоёмов и рыб' }).click();
  80  |   const input = page.locator('.search__input');
  81  |   await expect(input).toBeVisible();
  82  |   // Dialog styles must be present even when the search is the first dialog opened.
  83  |   const pos = await page.locator('.dlg.search').evaluate((el) => getComputedStyle(el).position);
  84  |   expect(pos).toBe('fixed');
  85  |   await input.fill('лампоч');
  86  |   await expect(page.locator('[cmdk-item]').first()).toContainText('Лампочка');
  87  |   await input.fill('щук');
  88  |   await expect(page.locator('[cmdk-item]', { hasText: 'Щука' }).first()).toBeVisible();
  89  |   await shot(page, '08-search');
  90  | });
  91  | 
  92  | test('9. tapping a cluster bubble zooms in to split it', async ({ page }) => {
  93  |   await page.goto('/');
> 94  |   await page.waitForFunction(() => !!(window as any).__map?.getLayer('clusters') && (window as any).__map.queryRenderedFeatures({ layers: ['clusters'] }).length > 0, null, { timeout: 30_000 });
      |              ^ TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
  95  |   await page.waitForTimeout(1500);
  96  |   const target = await page.evaluate(() => {
  97  |     const m = (window as any).__map;
  98  |     const r = m.getCanvas().getBoundingClientRect();
  99  |     const cs = m.queryRenderedFeatures({ layers: ['clusters'] }).map((c: any) => m.project(c.geometry.coordinates)).filter((p: any) => p.x > 60 && p.x < r.width - 60 && p.y > 130 && p.y < r.height * 0.5);
  100 |     return cs[0] ? { x: r.left + cs[0].x, y: r.top + cs[0].y, zoom: m.getZoom() } : null;
  101 |   });
  102 |   test.skip(!target, 'no cluster bubble in view at this viewport');
  103 |   await page.mouse.click(target!.x, target!.y);
  104 |   await page.waitForTimeout(1200);
  105 |   const zoom = await page.evaluate(() => (window as any).__map.getZoom());
  106 |   expect(zoom).toBeGreaterThan(target!.zoom + 0.8);
  107 | });
  108 | 
```
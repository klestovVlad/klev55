/** Small line glyphs for the infrastructure layer, drawn on canvas so they match the theme. */
export const INFRA_LABEL: Record<string, string> = {
  bridge: 'мост',
  dam: 'плотина',
  weir: 'перекат/водослив',
  lock: 'шлюз',
  slipway: 'спуск для лодок',
  fishing_shop: 'рыболовный магазин',
  fuel: 'заправка',
  camp_site: 'кемпинг',
};

export function infraIcon(kind: string, dark: boolean): ImageData {
  const s = 36;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  // disc
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 15, 0, Math.PI * 2);
  ctx.fillStyle = dark ? '#182630' : '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = dark ? '#9fb0b9' : '#55656e';
  ctx.stroke();
  ctx.strokeStyle = dark ? '#e6ecef' : '#14232b';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.translate(s / 2, s / 2);
  ctx.beginPath();
  switch (kind) {
    case 'bridge': // arch with deck
      ctx.moveTo(-9, 4);
      ctx.lineTo(9, 4);
      ctx.moveTo(-9, 4);
      ctx.quadraticCurveTo(0, -10, 9, 4);
      break;
    case 'dam': // wall with water step
    case 'weir':
    case 'lock':
      ctx.moveTo(-9, -5);
      ctx.lineTo(0, -5);
      ctx.lineTo(0, 5);
      ctx.lineTo(9, 5);
      ctx.moveTo(-9, 1);
      ctx.lineTo(-3, 1);
      break;
    case 'slipway': // ramp + hull
      ctx.moveTo(-9, 6);
      ctx.lineTo(9, -2);
      ctx.moveTo(-6, -3);
      ctx.lineTo(4, -3);
      ctx.lineTo(1, -7);
      ctx.lineTo(-3, -7);
      ctx.closePath();
      break;
    case 'fishing_shop': // hook
      ctx.moveTo(3, -9);
      ctx.lineTo(3, 3);
      ctx.arc(-1, 3, 4, 0, Math.PI, false);
      ctx.moveTo(3, -9);
      ctx.lineTo(3, -6);
      break;
    case 'fuel': // pump
      ctx.rect(-7, -8, 9, 15);
      ctx.moveTo(-5, -4);
      ctx.lineTo(0, -4);
      ctx.moveTo(2, -2);
      ctx.lineTo(7, -2);
      ctx.lineTo(7, 5);
      break;
    case 'camp_site': // tent
      ctx.moveTo(-9, 7);
      ctx.lineTo(0, -8);
      ctx.lineTo(9, 7);
      ctx.closePath();
      ctx.moveTo(-3, 7);
      ctx.lineTo(0, 1);
      ctx.lineTo(3, 7);
      break;
  }
  ctx.stroke();
  return ctx.getImageData(0, 0, s, s);
}

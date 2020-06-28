import generate3D from './generate3D.js'

generate3D({
  weapon_type: '步枪',
  type: 0,
  loadMethod: 1,
  zoom: 2,
  device: 'pc',
  el: '.main',
  asTexture: ['https://csgo-java.c5game.com/3d/202006/18901053701/ak47.jpg'],
  asObj: ['https://csgo-java.c5game.com/csgo/obj/u-ak47.obj-5ee3499b7c7f9.obj'],
  asMtl: ['https://csgo-java.c5game.com/3d/202006/18901053701/ak47.mtl']
})
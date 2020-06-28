// 获取检视图信息
var percent = 0;
var polling = null;
function acquireInspect(type) {
  var query = qs.parse(location.search.slice(1))

  if (type == 0) {
    percent = 0
  }

  http('/v1/3d/view', {
    type: 'GET',
    data: {
      asset_id: query.a || 0
    }
  }).then(
    res => {
      if (res.code != 0) {
        if (res.code == 19) {
          let sReadHtml = indexReadTwig({
            status: 2,
            message: '加载失败'
          });
          updateInspect(1, query.a, 2, '', '');
          removeLoading();
          $('.index-read').html(sReadHtml);
          $('#J_ShowSkin .text').html('点击切换皮肤');
        } else if (res.code == 20) {
          let sReadHtml = indexReadTwig({
            status: 2,
            message: '不支持该饰品检视，请稍后再试'
          });

          removeLoading();
          $('.index-read').html(sReadHtml);
          $('#J_ShowSkin .text').html('点击切换皮肤');
        } else {
          ZENG(res.message);
        }

        stopPolling();
      } else {
        let oData = res.result;
        let sBottomLeftHtml = indexBottomLeftTwig({
          data: oData
        });
        let sBottomMiddleHtml = indexBottomMiddleTwig({
          data: oData
        })
        let sBottomInspectHtml =
          '<a href="' + oData.inspect_url + '">'
          + '<button class="btn btn-hyaline">'
          + '<i class="icon iconfont icon-tip f30 media-left media-middle"></i>'
          + '<span class="media-body media-middle">去游戏中检视</span>'
          + '</button>'
          + '</a>'
          ;

        if (oData.status == 0) {
          // 排队中
          var asInspect = localStorage.getItem('asInspect') ? JSON.parse(localStorage.getItem('asInspect')) : []
          for (var i = 0; i < asInspect.length; i++) {
            if (asInspect[i].id == query.a) {
              percent = asInspect[i].percentage
            }
          }
          percent = percent + (90 - percent) / 3;


          if (type == 0) {
            var sReadHtml = indexReadTwig({
              status: 0,
              baseUrl: window.haw.configs.baseUrl,
              percentage: percent,
              waitTime: oData.wait_time
            });

            removeLoading();
            $('.index-read').html(sReadHtml);
          } else {
            $('.index-read .j_ProgressBar').css({
              width: percent + '%'
            })
          }

          startPolling();
        } else if (oData.status == 1) {
          // 生成成功
          var asMergeTexture = [],
            asMergeObj = [],
            asMergeMtl = []
            ;

          if (oData.style == 1) {
            // 双枪和双刀
            asMergeTexture.push(oData.img_url_3d[0]);
            asMergeTexture.push(oData.img_url_3d[0]);

            asMergeObj.push(oData.obj_url_3d[0]);
            asMergeObj.push(oData.obj_url_3d[0]);

            asMergeMtl.push(oData.mtl_url[0]);
            asMergeMtl.push(oData.mtl_url[0]);
          } else {
            asMergeTexture = oData.img_url_3d;
            asMergeObj = oData.obj_url_3d;
            asMergeMtl = oData.mtl_url;
          }

          stopPolling();
          $('.index-read .j_ProgressBar').css({
            width: percent + '%'
          });
          var sReadHtml = indexReadTwig({
            status: 0,
            baseUrl: window.haw.configs.baseUrl,
            percentage: 100,
            waitTime: oData.wait_time
          });
          $('.index-read').html(sReadHtml);
          setTimeout(() => {
            generate3D({
              weapon_type: oData.weapon_type,
              type: oData.style,
              loadMethod: oData.load_style,
              zoom: oData.zoom,
              device: 'pc',
              el: '.index-main',
              asTexture: asMergeTexture,
              asObj: asMergeObj,
              asMtl: asMergeMtl
            }, () => {
              // 排队中
              removeLoading();
              $('.index-read').html('');
            });
          }, 150)
        } else if (oData.status == 2) {
          // 生成失败
          let sReadHtml = indexReadTwig({
            status: 2,
            message: '加载失败'
          });

          removeLoading();
          $('.index-read').html(sReadHtml);
          $('#J_ShowSkin .text').html('点击切换皮肤');
        }

        $('.index-bottom .bottom-inspect').html(sBottomInspectHtml);
        $('.index-bottom .left-info').html(sBottomLeftHtml);
        $('.index-bottom .bottom-middle').html(sBottomMiddleHtml);
        $('#J_ShowSkin .text').html(oData.arms_name);
        stickerTip();

        if (oData.sticker && oData.sticker[0]) {
          newGuide(1);
        } else {
          newGuide(-1);
        }
      }
    }
  )

  acquireOtherData();
}

// 开启轮询检视图
function startPolling() {
  if (polling != null) {
    stopPolling();
  }

  polling = setInterval(() => {
    acquireInspect(1)
  }, 5000)
}

// 停止轮询检视图
function stopPolling() {
  clearInterval(polling);
  polling = null;
}


// 获取价格，排名和链接
function acquireOtherData() {
  var query = qs.parse(location.search.slice(1))

  http('/v1/3d/view-other', {
    type: 'GET',
    data: {
      asset_id: query.a || 0
    }
  }).then(
    res => {
      if (res.code != 0) {
        // ZENG(res.message);
        let sBottomRightHtml = indexBottomRightTwig({
          code: res.code
        });
        updateInspect(1, query.a, 2, '', '');
        $('.index-bottom .bottom-right').html(sBottomRightHtml);
      } else {
        var oData = res.result,
          item = {
            status: oData.status,
            id: oData.asset_id,
            img: oData.img,
            name: oData.arms_name
          }
          ;
        if (res.result.status === 0) {
          updateInspect(0, res.result.asset_id, res.result.status, res.result.img, res.result.arms_name);
        } else {
          updateInspect(1, res.result.asset_id, res.result.status, res.result.img, res.result.arms_name);
        }

        addInspect(item, 0);

        if (oData.abrasion_rank > 0) {
          $('.index-bottom .left-rank').html('当前C5GAME磨损排名：' + oData.abrasion_rank);
        }

        ajax('/api/product/get-url', {
          type: 'GET',
          data: {
            device: 1,
            item_id: oData.item_id,
            asset_id: item.id
          }
        }).then(
          res => {
            if (res.status != 200) {
              ZENG(res.message);
            } else {
              oData.steam_price = oData.steam_price * 1
              oData.c5_price = oData.c5_price * 1
              let sBottomRightHtml = indexBottomRightTwig({
                data: oData,
                buyUrl: res.body.url
              });

              $('.index-bottom .bottom-right').html(sBottomRightHtml);
            }
          }
        )
      }
    }
  )
}


// 新手引导
function newGuide(bIsSticker) {
  if (!Cookies.get('new_user')) {
    if (bIsSticker == 1) {
      // 有印花
      setTimeout(() => {
        $('.j_NoviceGuide2').show();

        $('.j_NoviceGuide2 .btn').on('click', function () {
          $('.j_NoviceGuide2').hide();
          $('.j_NoviceGuide1').show();
        })

        $('.j_NoviceGuide1 .btn').on('click', function () {
          $('.j_NoviceGuide1').hide();
          $('#J_StickerTip').removeClass('hide');

          Cookies.set('new_user', '-1', { path: '/', expires: 365 });
        })

        // setTimeout(() => {
        //     $('.j_NoviceGuide2').hide();
        //     $('.j_NoviceGuide1').show();

        //     $('.j_NoviceGuide1 .btn').on('click', function(){
        //         $('.j_NoviceGuide1').hide();
        //         $('#J_StickerTip').removeClass('hide');

        //         Cookies.set('new_user', '-1');
        //     })

        //     setTimeout(() => {
        //         $('.j_NoviceGuide1').hide();
        //         $('#J_StickerTip').removeClass('hide');

        //         Cookies.set('new_user', '-1');
        //     }, 10000)
        // }, 10000)
      }, 5000)
    } else {
      // 无印花
      setTimeout(() => {
        $('.j_NoviceGuide1').show();

        $('.j_NoviceGuide1 .btn').on('click', function () {
          $('.j_NoviceGuide1').hide();
          $('#J_StickerTip').removeClass('hide');

          Cookies.set('new_user', '-1', { path: '/', expires: 365 });
        })

        // setTimeout(() => {
        //     $('.j_NoviceGuide1').hide();
        //     $('#J_StickerTip').removeClass('hide');

        //     Cookies.set('new_user', '-1')
        // }, 10000)
      }, 5000)
    }
  } else {
    $('#J_StickerTip').removeClass('hide');
  }
}


// 加载中
function removeLoading() {
  $('.index-loading').addClass('opacity');
  $('.index-content').removeClass('opacity');
}


// 重置内容
function resetData() {
  $('#J_ShowSkin .text').html('');

  $('.index-read').html('');
  $('.index-main').html('');

  $('.index-bottom .bottom-inspect').html('');
  $('.index-bottom .left-rank').html('');
  $('.index-bottom .left-info').html('');
  $('.index-bottom .bottom-middle').html('');
  $('.index-bottom .bottom-right').html('');
}


// 获取检视图
readInspect(query.a)
function readInspect(asset_id) {
  var asInspect = localStorage.getItem('asInspect') ? JSON.parse(localStorage.getItem('asInspect')) : [],
    //asInspect = Cookies.get('asInspect') ? JSON.parse(Cookies.get('asInspect')) : [],
    sSwiperHtml = indexSwiperTwig({
      id: asset_id,
      asInspect: asInspect
    })
    ;

  $('.swiper-wrapper').html(sSwiperHtml);
  initSwiper();
}

// 添加检视图
var asLoad = [];
var polling_status = null;
function addInspect(item, isRefresh) {
  var asInspect = localStorage.getItem('asInspect') ? JSON.parse(localStorage.getItem('asInspect')) : [],
    // asInspect = Cookies.get('asInspect') ? JSON.parse(Cookies.get('asInspect')) : [],
    oInspect = {
      status: item.status,
      id: item.id || (asInspect.length + 1),
      img: item.img,
      name: item.name,
      percentage: item.percentage
    },
    bIsAdd = true
    ;

  asLoad = [];

  if (asInspect && asInspect[0]) {
    for (let i = 0; i < asInspect.length; i++) {
      if (asInspect[i].id == oInspect.id) {
        bIsAdd = false
      }
    }
  } else {
    bIsAdd = true
  }

  if (bIsAdd) {
    asInspect.unshift(oInspect)
  }
  // Cookies.set('asInspect', JSON.stringify(asInspect));
  localStorage.setItem('asInspect', JSON.stringify(asInspect));

  if (asInspect && asInspect[0]) {
    for (let i = 0; i < asInspect.length; i++) {
      if (asInspect[i].status == 0) {
        asLoad.push(asInspect[i].id);
      }
    }
  }

  if (isRefresh == 1) {
    page("/?a=" + oInspect.id);

    // resetData();
    // acquireInspect(0);

    // window.location.href = "/?a=" + oInspect.id;
  }

  readInspect(query.a);

  if (asLoad.length > 0) {
    startPollingStatus();
  }
}

// 开启轮询状态
function startPollingStatus() {
  if (polling_status != null) {
    stopPollingStatus();
  }

  polling_status = setInterval(() => {
    pollingStatus(asLoad);
  }, 4000)
}

// 停止轮询状态
function stopPollingStatus() {
  clearInterval(polling_status);
  polling_status = null;
}

// 轮询状态
function pollingStatus(asLoad) {
  var queryArr = []
  for (var i = 0; i < asLoad.length; i++) {
    if (asLoad[i] != query.a) {
      queryArr.push(asLoad[i])
    }
  }
  if (queryArr.length <= 0) {
    return false
  }
  http('/v1/3d/view-status', {
    type: 'GET',
    data: {
      asset_ids: queryArr
    }
  }).then(
    res => {
      if (res.code != 0) {
        stopPollingStatus();
      } else {
        var asData = res.result.assets;

        for (var i = 0; i < asData.length; i++) {
          if (asData[i].status == 1 || asData[i].status == 2) {
            var item = asData[i]
            http('/v1/3d/view-other', {
              type: 'GET',
              data: {
                asset_id: asData[i].asset_id
              }
            }).then(
              res => {
                if (res.code != 0) {
                  stopPollingStatus();
                  updateInspect(1, item.asset_id, 2, '', '');
                } else {
                  updateInspect(1, res.result.asset_id, res.result.status, res.result.img, res.result.arms_name);
                }
              }
            )
          } else {
            updateInspect(0, asData[i].asset_id, asData[i].status, '', '');

            // for(var j = 0; j < asInspect.length; j++){

            //     if(asInspect[j].id == res.result.asset_id){
            //         percent = asInspect[j].percentage + (90 - asInspect[j].percentage) / 3;

            //         asInspect[j].status = asData[i].status;
            //         asInspect[j].percentage = percent;
            //         $('.j_ProgressBar').eq(j).css({
            //             width: percent + '%'
            //         })
            //     }
            // }

            // readInspect(query.a);
          }
        }
      }
    }
  )
}

// 删除检视图
function removeInspect(id) {
  var asInspect = localStorage.getItem('asInspect') ? JSON.parse(localStorage.getItem('asInspect')) : [],
    // asInspect = Cookies.get('asInspect') ? JSON.parse(Cookies.get('asInspect')) : [],
    asNewInspect = []
    ;

  for (let i = 0; i < asInspect.length; i++) {
    if (asInspect[i].id != id) {
      asNewInspect.push(asInspect[i]);
    }
  }
  // Cookies.set('asInspect', JSON.stringify(asNewInspect));
  localStorage.setItem('asInspect', JSON.stringify(asNewInspect));

  readInspect(query.a);
}

// 更新检视图
function updateInspect(type, id, status, img, name) {
  var asInspect = localStorage.getItem('asInspect') ? JSON.parse(localStorage.getItem('asInspect')) : []
    // asInspect = Cookies.get('asInspect') ? JSON.parse(Cookies.get('asInspect')) : [],
    ;

  asLoad = [];

  for (let i = 0; i < asInspect.length; i++) {
    if (asInspect[i].id == id) {
      asInspect[i].status = status;
      asInspect[i].img = img;
      if (name) {
        asInspect[i].name = name;
      }
      asInspect[i].percentage = asInspect[i].percentage + (90 - asInspect[i].percentage) / 3;

      if (type == 0) {
        $('.j_SwiperSlide').eq(i).find('.j_ProgressBar').css({
          width: asInspect[i].percentage + '%'
        })
      }
    }

    if (asInspect[i].status == 0) {
      asLoad.push(asInspect[i].id);
    }
  }
  // Cookies.set('asInspect', JSON.stringify(asInspect));
  localStorage.setItem('asInspect', JSON.stringify(asInspect));

  if (asLoad.length == 0) {
    stopPollingStatus();
  }

  if (type == 1) {
    readInspect(query.a);
  }
}


// 分享
shareData(query.a)
function shareData(asset_id) {
  var shareId = asset_id || 0;

  $('#J_SharePopover').popover('destroy');
  $('#J_SharePopover').popover({
    html: true,
    animation: false,
    trigger: 'manual',
    placement: 'auto bottom',
    container: 'body',
    template: '<div class="popover popover-zindex popover-share" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
    content: indexShareTwig({ baseUrl: window.haw.configs.baseUrl, shareUrl: window.location.href.split('?')[0] + '?a=' + shareId })
  })
    .on('shown.bs.popover', function () {
      $('#J_Qrcode').html('');
      $('#J_Qrcode').qrcode({
        width: 90,
        height: 90,
        text: window.location.href.split('?')[0] + '?a=' + shareId
      })

      $('#J_Share').share({
        sites: ['qq', 'weibo'],
        mandatory: {
          URL: window.location.href.split('?')[0] + '?a=' + shareId
        }
      })

      var clipboard = new Clipboard('#J_CopyLink');
      clipboard.on('success', function (e) {
        ZENG('复制成功');
        e.clearSelection();
      });
      clipboard.on('error', function (e) {
        ZENG('复制失败，请手动复制');
      });
    })
    .on('mouseenter', function () {
      let _this = this

      $(this).popover('show')
      $('.popover').on('mouseleave', function () {
        $(_this).popover('hide');
      });
    })
    .on('mouseleave', function () {
      let _this = this

      setTimeout(function () {
        if (!$('.popover:hover').length) {
          $(_this).popover('hide')
        }
      }, 100)
    })
}


// 错误提示
function ZENG(message) {
  $('.index-inspect-tip span').html(message);
  $('.index-inspect-tip').addClass('animated');
  setTimeout(() => {
    $('.index-inspect-tip').removeClass('animated');
  }, 2000)
}


// 检视图左右切换
function initSwiper() {
  var query = qs.parse(location.search.slice(1))
  new swiper('.skin-swiper', {
    noSwiping: true,
    slidesPerView: 5.5,
    slidesPerGroup: 2,
    spaceBetween: 30,
    watchSlidesVisibility: true,
    watchSlidesProgress: true,
    // 如果需要前进后退按钮
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
  })
}

// 检视图的展开和收起
$(document)
  .on('click', '#J_ShowSkin', function () {
    if ($('#J_IndexSkin').is(':hidden')) {
      $('#J_ShowSkin .arrow').addClass('up');
      $('#J_IndexSkin').slideToggle();
    } else {
      $('#J_ShowSkin .arrow').removeClass('up');
      $('#J_IndexSkin').slideToggle();
    }

    initSwiper();
  })
  ;
// $(document)
//     .off('mouseenter', '#J_ShowSkin').on('mouseenter', '#J_ShowSkin', function(){
//         setTimeout(() => {
//             $('#J_ShowSkin .arrow').addClass('up');
//             $('#J_IndexSkin').slideDown();

//             initSwiper();
//         }, 0)
//     })
//     .off('mouseleave', '#J_ShowSkin').on('mouseleave', '#J_ShowSkin', function(){
//         setTimeout(() => {
//             if(!$('#J_IndexSkin:hover').length){
//                 $('#J_ShowSkin .arrow').removeClass('up');
//                 $('#J_IndexSkin').slideUp();
//             }
//         }, 300)
//     })
// ;
// $(document).off('mouseleave', '#J_IndexSkin').on('mouseleave', '#J_IndexSkin', function(){
//     setTimeout(() => {
//         $('#J_ShowSkin .arrow').removeClass('up');
//         $('#J_IndexSkin').slideUp();
//     }, 300)
// });

// 添加新的检视图
$(document).on('click', '.j_AddInspect', function () {
  if ($('.index-inspect-overlay').hasClass('animated')) {
    $('.index-inspect-overlay').removeClass('animated');
    $('.gx-mask').addClass('hide');
  } else {
    $('.index-inspect-overlay').addClass('animated');
    $('.index-inspect-overlay input').focus();
    $('.gx-mask').removeClass('hide');
  }

  if ($(this).data('type') == 2) {
    if ($('#J_IndexSkin').is(':visible')) {
      $('#J_ShowSkin .arrow').removeClass('up');
      $('#J_IndexSkin').slideToggle();
    }
  }
})

// 添加检视图链接
$(document).on('keyup', '.inspect-overlay-input input', function (event) {
  var bIsAction = true;

  if (!bIsAction) {
    return
  }

  if ($(this).val()) {
    $(this).siblings('.clear').show();
  } else {
    $(this).siblings('.clear').hide();
  }

  if (event.keyCode == "13") {
    // 提交
    if ($(this).val()) {
      bIsAction = false;
      $('.inspect-overlay-input .clear').hide();
      $('.inspect-overlay-input .loading').show();

      http('/v1/3d/create-by-url', {
        type: 'POST',
        data: {
          inspect_url: $(this).val()
        }
      }).then(
        res => {
          if (res.code != 0) {
            bIsAction = true;
            $('.inspect-overlay-input .clear').show();
            $('.inspect-overlay-input .loading').hide();

            ZENG(res.message);
          } else {
            var asset_id = res.result.asset_id,
              arms_name = res.result.arms_name
              ;

            bIsAction = true;
            $('.inspect-overlay-input .loading').hide();

            $('.index-inspect-overlay input').val('');
            $('.index-inspect-overlay').removeClass('animated');
            $('.gx-mask').addClass('hide');

            if ($('#J_IndexSkin').is(':hidden')) {
              $('#J_ShowSkin .arrow').addClass('up');
              $('#J_IndexSkin').slideToggle();
            }

            http('/v1/3d/view-other', {
              type: 'GET',
              data: {
                asset_id: asset_id
              }
            }).then(
              res => {
                var item = {
                  status: res.result.status,
                  id: asset_id,
                  img: '',
                  name: arms_name,
                  percentage: 30
                }

                if (res.code != 0) {
                  // ZENG(res.message);
                } else {
                  item.img = res.result.img;
                }

                addInspect(item, 0);
              }
            )
          }
        }
      )
    } else {
      ZENG('请输入检视链接');
    }
  }
})
$(document).on('click', '.inspect-overlay-input .clear', function () {
  $(this).hide();
  $(this).siblings('input').val('');
})

// 添加检视图说明展开和收起
$(document).on('click', '.inspect-overlay-arrow', function () {
  if ($('.inspect-overlay-info').is(':visible')) {
    $(this).removeClass('up');
    $('.inspect-overlay-info').slideToggle();
  } else {
    $(this).addClass('up');
    $('.inspect-overlay-info').slideToggle();
  }
})

// 隐藏添加浮层
$(document).on('click', '.gx-mask', function () {
  if ($('.index-inspect-overlay').hasClass('animated')) {
    $('.index-inspect-overlay').removeClass('animated');
    $('.gx-mask').addClass('hide');
  }
})

$(document).on('mouseover', '.swiper-slide-item', function () {
  if ($('.j_SwiperSlide').length == 1) {
    $(this).find('.j_Delete').hide();
  }
})


// 删除检视图
$(document).on('click', '.j_Delete', function (event) {
  var jThis = $(this),
    jThisSwiperSlide = jThis.parents('.swiper-slide')
    ;

  event.stopPropagation();

  jThisSwiperSlide.remove();
  removeInspect(jThisSwiperSlide.data('id'));
})

// 切换检视图
$(document).on('click', '.j_SwiperSlide:not(".j_Delete")', function () {
  page("/?a=" + $(this).data('id'));
  resetData();
  acquireInspect(0);
  query.a = $(this).data('id')
  shareData($(this).data('id'));

  // window.location.href = window.location.href.split('?')[0] + '?asset_id=' + $(this).data('id')
})


// 印花提示
function stickerTip() {
  $('#J_StickerTip').popover({
    html: true,
    animation: false,
    trigger: 'manual',
    placement: 'right auto',
    container: 'body',
    template: '<div class="popover popover-zindex popover-tip" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
    content: '<a href="' + $('#J_StickerTip').data('inspect-url') + '" class="f16">去游戏中检视</a>'
  })
    .on('mouseenter', function () {
      let _this = this

      $(this).popover('show')
      $('.popover').on('mouseleave', function () {
        $(_this).popover('hide');
      });
    })
    .on('mouseleave', function () {
      let _this = this

      setTimeout(function () {
        if (!$('.popover:hover').length) {
          $(_this).popover('hide')
        }
      }, 100)
    })
}


// 购买
$(document).on('click', '#J_Buy', function () {
  // Cookies.set('isShowBuy', '1');
});


// 返回首页
$(document).on('click', '#J_GoHome', function () {
  window.location.href = "/";
});


// 获取数据（价格，排名和链接）
$(document).on('click', '#J_Price', function () {
  acquireOtherData();
});


page('*', function (ctx) {
  ctx.query = qs.parse(ctx.querystring)
})

page({
  click: false,
  dispatch: false
})
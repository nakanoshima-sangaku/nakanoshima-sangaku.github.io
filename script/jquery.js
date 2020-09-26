$(document).ready(function() {
  $('#map').css(
      'width',
      $('#map_container').css('width'));  // 読み込まれた時点でサイズ変更
  $('#map').css(
      'height',
      $('#map_container')
          .css('height'));  // mapのサイズはmap_containerに合わせる
  $(window).on('load resize', function() {
    $('#map').css('width', $('#map_container').css('width'));
    $('#map').css('height', $('#map_container').css('height'));
  });
  year_default = 2019;
  $('.year').on('click', function() {
    $('.activity').hide();
    $(this).css('color', 'purple')
  });  //
  [2016, 2017, 2018, 2019, 2020].forEach(year => {
    $(`#year${year}`).on('click', () => $(`#activity${year}`).show());
    if (year !== year_to_show) {
      $(`#activity${year}`).hide()
    }
  });
});

KISSY.config({
  packages: [{
    name: 'components',
    path: '../'
  }]
});

module('mock');

test('mock data', function() {
  stop();
  KISSY.use(['components/mock/index'], function(S, Mock) {
    var template = {
      "data|5-10": [{
        "married|0-1": true,
        "name": "@MALE_FIRST_NAME @LAST_NAME",
        "sons": null,
        'daughters|0-3': [{
          "age|0-31": 0,
          "name": "@FEMALE_FIRST_NAME"
        }]
      }],
      info: {
        "oK|0-1": true,
        "message": "@MALE_FIRST_NAME @LAST_NAME"
      }
    };
    Mock.mock(/.+.json/, template);

    var data = Mock.mock(template);
    ok(data.data.length > 0, 'data ok');

    start();
  }) // use
})

test('mock ajax', function() {
  stop();
  KISSY.use(['components/mock/index'], function(S, Mock) {
    KISSY.io({
      url: 'test.json',
      success: function(data, textStatus, xhrObj) {
        ok(true, 'mock ajax success.');
        console.log('[success]', data);
      },
      error: function(textStatus, xhrObj) {
        ok(false, 'mock ajax fail.');
      },
      complete: function() {
        start();
      }
    }) // io
  }) // use
});
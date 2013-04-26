/*
  Mock
  模拟请求 & 模拟数据
  作者：墨智

  参考资料：
  http://www.elijahmanor.com/2013/04/angry-birds-of-javascript-green-bird.html
  https://github.com/mennovanslooten/mockJSON
  https://github.com/appendto/jquery-mockjax
*/
KISSY.add("app/models/mock", function(S, Mock) {
  
  Mock.mock(/api\/home.json/, {
    data: {
      "count|1-10": 1,
      "list|5-10": [{
        "name|1-10": "@MALE_FIRST_NAME @LAST_NAME",
        "status|0-3": 0,
        "updateTime": "2012-12-12",
        "beginTime": "2012-04-04",
        "endTime": "2012-04-10",
        "auditComments": null,
        "id|+1": 10000,

        "created_date": "@DATE_YYYY/@DATE_MM/@DATE_DD",
        "created_time": "@TIME_HH:@TIME_MM:@TIME_SS",
        "title|2-4": "@LOREM ",
        "description": "@LOREM_IPSUM"

      }]
    },
    info: {
      "ok": true,
      "message": "@MALE_FIRST_NAME @LAST_NAME"
    }
  });
  
  Mock.mock(/.+.json/, {
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
      "ok|0-1": true,
      "message": "@MALE_FIRST_NAME @LAST_NAME"
    }
  });

  return Mock;
}, {
  requires: ['components/mock/index']
});
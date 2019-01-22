exports.schedule = {
    type: 'worker',
    cron: '0 0 3 * * *', //每天凌晨三点执行一次
};
exports.task = function* (ctx) {
    console.log("*******定时任务-每天凌晨三点发送********");
    // let accesstoken = yield ctx.service.access.getAccessToken();
    // console.log(yield ctx.service.msgpush.jd_case_dept_push(accesstoken));
};


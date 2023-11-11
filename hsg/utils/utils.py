import pytz

from datetime import datetime
TIME_FORMAT = '%Y-%m-%d %H:%M:%S'
TIME_ZONE = 'PST8PDT'


def time_zone_conversion(src_timestamp):
    """
    将UTC时间转为本地时区, 可输入时间戳或者时间字符串
    """
    if isinstance(src_timestamp, str):
        src_timestamp = int(datetime.strptime(src_timestamp, TIME_FORMAT).timestamp())
    tgt_datetime = datetime.fromtimestamp(src_timestamp, pytz.timezone(TIME_ZONE))
    return datetime.strftime(tgt_datetime, TIME_FORMAT)

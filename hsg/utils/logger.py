import logging
import os

logger_initialized = {}
logger_with_log_file = {}


def get_root_logger(name='py.warnings', log_file=None, log_level="INFO"):
    """
    Get logger instance

    Args:
        name: logger name
        log_file: log save path
        log_level: "NOTSET", "INFO", "DEBUG", "WARNING", "ERROR", "CRITICAL"

    Returns:
        logger
    """

    log_level = {
        'NOTSET': logging.NOTSET,
        'INFO': logging.INFO,
        'DEBUG': logging.DEBUG,
        'WARNING': logging.WARNING,
        'ERROR': logging.ERROR,
        'CRITICAL': logging.CRITICAL
    }[log_level]
    logger = get_logger(name=name, log_file=log_file, log_level=log_level)
    return logger


def get_logger(name, log_file=None, log_level=logging.INFO):
    """Initialize and get a logger by name.

    If the logger has not been initialized, this method will initialize the
    logger by adding one or two handlers, otherwise the initialized logger will
    be directly returned. During initialization, a StreamHandler will always be
    added. If `log_file` is specified and the process rank is 0, a FileHandler
    will also be added.

    Args:
        name (str): Logger name.
        log_file (str | None): The log filename. If specified, a FileHandler
            will be added to the logger.
        log_level (int): The logger level. Note that only the process of
            rank 0 is affected, and other processes will set the level to
            "Error" thus be silent most of the time.

    Returns:
        logging.Logger: The expected logger.
    """
    rank = 0

    handlers = []
    if name in logger_initialized:
        logger = logger_initialized[name]
    else:
        logger = logging.getLogger(name)
        logging.captureWarnings(True)
        handlers.append(logging.StreamHandler())

    if name in logger_with_log_file and logger_with_log_file[name] is not None:
        return logger_initialized[name]
    else:
        logger_with_log_file[name] = log_file
        # only rank 0 will add a FileHandler
        if rank == 0 and log_file is not None:
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            file_handler = logging.FileHandler(log_file, 'a')
            handlers.append(file_handler)

    formatter = logging.Formatter(
        '[%(asctime)s][%(levelname)s][%(pathname)s][%(lineno)d] %(message)s')
    for handler in handlers:
        handler.setFormatter(formatter)
        handler.setLevel(log_level)
        logger.addHandler(handler)

    for handlers in logger.handlers:
        handlers.setLevel(log_level)

    if rank == 0:
        logger.setLevel(log_level)
    else:
        logger.setLevel(logging.ERROR)

    if name not in logger_initialized:
        logger_initialized[name] = logger

    return logger

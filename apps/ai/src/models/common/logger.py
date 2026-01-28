import logging

def get_logger(name: str) -> logging.Logger:
    """
    공통 logger 함수
    """

    logger = logging.getLogger(name)

    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
    )

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.propagate = False #중복 출력 방지

    return logger
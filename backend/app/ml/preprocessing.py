import pandas as pd


FEATURE_COLUMNS = [
    "amount",
    "amount_log",
    "is_high_value",
    "is_card_payment",
    "is_upi_payment",
    "unknown_location",
]


def prepare_features(features: dict) -> pd.DataFrame:
    return pd.DataFrame(
        [[features.get(column, 0) for column in FEATURE_COLUMNS]],
        columns=FEATURE_COLUMNS,
    )
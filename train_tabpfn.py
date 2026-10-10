"""Gate task: does TabPFN beat simple baselines on real landslide data?
Two splits: by time (generalizes to the future) and by geography with
India held out entirely (proves it generalizes globally, not just
memorizing one region). Reads TABPFN_TOKEN from .env.
"""
import pandas as pd
from dotenv import load_dotenv
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from tabpfn_client import TabPFNClassifier

load_dotenv()

df = pd.read_csv("landslide_dataset.csv")
FEATURES = ["rain_1d", "rain_3d", "rain_7d", "rain_14d", "lat", "lon"]
X, y = df[FEATURES].fillna(0), df["label"]


def evaluate(name, X_train, X_test, y_train, y_test):
    tabpfn = TabPFNClassifier()
    tabpfn.fit(X_train, y_train)
    t_pred = tabpfn.predict(X_test)
    t_proba = tabpfn.predict_proba(X_test)[:, 1]

    lr = LogisticRegression(max_iter=1000).fit(X_train, y_train)
    maj = [y_train.mode()[0]] * len(y_test)

    print(f"\n=== {name} (train={len(X_train)}, test={len(X_test)}) ===")
    print(f"Majority baseline:   {accuracy_score(y_test, maj):.3f}")
    print(f"Logistic regression: {accuracy_score(y_test, lr.predict(X_test)):.3f}")
    print(f"TabPFN accuracy:     {accuracy_score(y_test, t_pred):.3f}")
    print(f"TabPFN AUC:          {roc_auc_score(y_test, t_proba):.3f}")


# Split 1: time, stratified by label so the test set stays balanced
# regardless of how positive/negative dates happened to be sampled.
# Last 20% of each class by date, train on the rest.
train_idx, test_idx = [], []
for label_value in [0, 1]:
    sub = df[df["label"] == label_value].sort_values("date")
    cut = int(len(sub) * 0.8)
    train_idx += list(sub.index[:cut])
    test_idx += list(sub.index[cut:])
evaluate("TIME split (stratified)", X.loc[train_idx], X.loc[test_idx], y.loc[train_idx], y.loc[test_idx])

# Split 2: geography, train with India excluded, test on India only.
# Needs India-tagged negatives (run add_india_negatives.py first) or the
# test set is positives-only and the baseline/AUC numbers are meaningless.
is_in = df["country"] == "India"
n_india_pos = int((y[is_in] == 1).sum())
n_india_neg = int((y[is_in] == 0).sum())
print(f"\n(India test set: {n_india_pos} positives, {n_india_neg} negatives)")
if n_india_neg == 0:
    print("No India negatives yet, skipping GEO split. Run add_india_negatives.py first.")
else:
    evaluate("GEO split (India held out)", X[~is_in], X[is_in], y[~is_in], y[is_in])


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

// ============================================================
// GENERIC API REQUEST
// ============================================================

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "ledgerguard_token"
        )
      : null;

  const headers = new Headers(
    options.headers
  );

  // Set JSON content type if not already provided.
  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  // Attach JWT authentication token.
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    let errorMessage =
      errorText;

    // Extract FastAPI "detail" message when available.
    try {
      const errorData =
        JSON.parse(errorText);

      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail ===
          "string"
            ? errorData.detail
            : JSON.stringify(
                errorData.detail
              );
      }
    } catch {
      // Response was not JSON.
    }

    throw new Error(
      errorMessage ||
        `Request failed with status ${response.status}`
    );
  }

  // Handle empty/non-JSON responses safely.
  const contentType =
    response.headers.get(
      "content-type"
    );

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  return null;
}

// ============================================================
// AUTHENTICATION
// ============================================================

export async function login(
  email: string,
  password: string
) {
  return apiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );
}

export async function getCurrentUser() {
  return apiRequest(
    "/api/auth/me"
  );
}

// ============================================================
// TRANSACTIONS
// ============================================================

export async function getTransactions(
  limit = 50
) {
  return apiRequest(
    `/api/transactions/?limit=${limit}`
  );
}

// ============================================================
// ALERTS
// ============================================================

export async function getAlerts(
  limit = 50
) {
  return apiRequest(
    `/api/alerts/?limit=${limit}`
  );
}

// ============================================================
// INVESTIGATIONS
// ============================================================

export async function getInvestigations(
  limit = 50
) {
  return apiRequest(
    `/api/investigations/?limit=${limit}`
  );
}

/**
 * Execute an analyst action on an investigation.
 *
 * Supported actions:
 *
 * APPROVE
 * REJECT
 * ESCALATE
 * FALSE_POSITIVE
 * REQUEST_MORE_EVIDENCE
 */
export async function updateInvestigationAction(
  investigationId: string,
  action:
    | "APPROVE"
    | "REJECT"
    | "ESCALATE"
    | "FALSE_POSITIVE"
    | "REQUEST_MORE_EVIDENCE",
  note?: string
) {
  const params =
    new URLSearchParams();

  params.set(
    "action",
    action
  );

  if (note?.trim()) {
    params.set(
      "note",
      note.trim()
    );
  }

  return apiRequest(
    `/api/investigations/${encodeURIComponent(
      investigationId
    )}/action?${params.toString()}`,
    {
      method: "PATCH",
    }
  );
}

// ============================================================
// RECOVERY
// ============================================================

/**
 * Get recovery cases.
 *
 * GET /api/recovery/?limit=50
 */
export async function getRecoveries(
  limit = 50
) {
  return apiRequest(
    `/api/recovery/?limit=${limit}`
  );
}

/**
 * Complete/update a recovery case.
 *
 * PATCH /api/recovery/{recoveryId}/complete
 *
 * Body:
 * {
 *   recovered_amount: number
 * }
 */
export async function completeRecovery(
  recoveryId: string,
  recoveredAmount: number
) {
  return apiRequest(
    `/api/recovery/${encodeURIComponent(
      recoveryId
    )}/complete`,
    {
      method: "PATCH",
      body: JSON.stringify({
        recovered_amount:
          recoveredAmount,
      }),
    }
  );
}

// ============================================================
// CHARGEBACKS
// ============================================================

export async function getChargebacks(
  limit = 50
) {
  return apiRequest(
    `/api/chargebacks/?limit=${limit}`
  );
}

// ============================================================
// ANALYTICS
// ============================================================

/**
 * Get ML model performance metrics.
 *
 * GET /api/analytics/overview
 *
 * Returns:
 * - Accuracy
 * - Precision
 * - Recall
 * - F1 Score
 * - ROC-AUC
 * - Confusion matrix values
 * - Optimized decision threshold
 * - Validation cost
 */
export async function getAnalyticsOverview() {
  return apiRequest(
    "/api/analytics/overview"
  );
}

// ============================================================
// RISK INTELLIGENCE
// ============================================================

export async function predictRisk(
  transactionId: string
) {
  return apiRequest(
    "/api/risk/predict",
    {
      method: "POST",
      body: JSON.stringify({
        transaction_id:
          transactionId,
      }),
    }
  );
}

# Phase 5 - Full Code

This document contains the complete change for Phase 5 of the Venafi TPP existing certificate adoption feature.

Scope:

- Prevent keymanager from generating a local private key while Venafi adoption is still deciding or has failed.
- Allow keymanager to continue once adoption is adopted, already present, skipped, expired, or otherwise terminal.

File:

- Update: `pkg/controller/certificates/keymanager/keymanager_controller.go`
- Update: `pkg/controller/certificates/keymanager/keymanager_controller_test.go`

Prerequisites:

- Phase 1 annotation and condition constants.
- Phase 4 adoption controller.

---

## 1. Change to `pkg/controller/certificates/keymanager/keymanager_controller.go`

### 1.1 Add the gate

In `ProcessItem`, immediately after `cminternal.SetRuntimeDefaults_Certificate(crt)` and before the comment that starts `// Discover all 'owned' secrets`, insert:

```go
	// If the Certificate opted into Venafi adoption, wait until the adoption
	// controller has reached a terminal state. This prevents keymanager from
	// generating a new key before the TPP private key has been fetched.
	if crt.Annotations[cmapi.VenafiAdoptExistingAnnotationKey] == "true" {
		if reason := venafiAdoptionWaitReason(crt); reason != "" {
			log.V(logf.DebugLevel).Info("Waiting for Venafi certificate adoption", "reason", reason)
			return nil
		}
	}
```

The resulting section looks like:

```go
	// Apply runtime defaults to apply default values that are governed by
	// controller feature gates, such as DefaultPrivateKeyRotationPolicyAlways.
	// We deep copy the object to avoid mutating the client-go cache.
	crt = crt.DeepCopy()
	cminternal.SetRuntimeDefaults_Certificate(crt)

	// If the Certificate opted into Venafi adoption, wait until the adoption
	// controller has reached a terminal state. This prevents keymanager from
	// generating a new key before the TPP private key has been fetched.
	if crt.Annotations[cmapi.VenafiAdoptExistingAnnotationKey] == "true" {
		if reason := venafiAdoptionWaitReason(crt); reason != "" {
			log.V(logf.DebugLevel).Info("Waiting for Venafi certificate adoption", "reason", reason)
			return nil
		}
	}

	// Discover all 'owned' secrets that have the `next-private-key` label
	secrets, err := certificates.ListSecretsMatchingPredicates(...)
```

### 1.2 Add the helper

Add this function near the bottom of `keymanager_controller.go`, before `controllerWrapper`:

```go
// venafiAdoptionWaitReason returns a non-empty reason when keymanager must wait
// for the Venafi adoption controller.
//
// Waiting reasons are states where a decision has not been made, or where a
// user action is required. Terminal states that allow normal issuance are:
// Adopted, AlreadyPresent, Skipped, Expired, NotYetValid,
// PrivateKeyUnavailable, NotFound, NotApplicable, and Renewal.
func venafiAdoptionWaitReason(crt *cmapi.Certificate) string {
	condition := apiutil.GetCertificateCondition(crt, cmapi.CertificateConditionVenafiAdoption)
	if condition == nil {
		// Adoption has not run yet.
		return "Pending"
	}

	if condition.Status == cmmeta.ConditionTrue {
		return ""
	}

	switch condition.Reason {
	case "Pending",
		"Failed",
		"RequiresRotationPolicyNever",
		"SearchFailed",
		"PermissionDenied",
		"RetrieveFailed",
		"KeyMismatch",
		"IdentityMismatch",
		"UsageMismatch",
		"CAMismatch",
		"InvalidCertificate",
		"Ambiguous",
		"Conflict":
		return condition.Reason
	default:
		return ""
	}
}
```

No new imports are required. The file already imports `apiutil`, `cmapi`, and `cmmeta`.

---

## 2. Change to `pkg/controller/certificates/keymanager/keymanager_controller_test.go`

Add the following cases to the `tests` map inside `TestProcessItem`.

The first two cases block key generation. The last two allow it and therefore expect the same Secret and status actions as the existing "create a secret and record its name if issuing is true" case.

```go
		"do nothing if Venafi adoption is pending": {
			certificate: &cmapi.Certificate{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: "testns",
					Name:      "test",
					Annotations: map[string]string{
						cmapi.VenafiAdoptExistingAnnotationKey: "true",
					},
				},
				Status: cmapi.CertificateStatus{
					Conditions: []cmapi.CertificateCondition{
						{
							Type:   cmapi.CertificateConditionIssuing,
							Status: cmmeta.ConditionTrue,
						},
						{
							Type:   cmapi.CertificateConditionVenafiAdoption,
							Status: cmmeta.ConditionFalse,
							Reason: "Pending",
						},
					},
				},
			},
		},
		"do nothing if Venafi adoption failed": {
			certificate: &cmapi.Certificate{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: "testns",
					Name:      "test",
					Annotations: map[string]string{
						cmapi.VenafiAdoptExistingAnnotationKey: "true",
					},
				},
				Status: cmapi.CertificateStatus{
					Conditions: []cmapi.CertificateCondition{
						{
							Type:   cmapi.CertificateConditionIssuing,
							Status: cmmeta.ConditionTrue,
						},
						{
							Type:   cmapi.CertificateConditionVenafiAdoption,
							Status: cmmeta.ConditionFalse,
							Reason: "KeyMismatch",
						},
					},
				},
			},
		},
		"create a secret if Venafi adoption is adopted": {
			certificate: &cmapi.Certificate{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: "testns",
					Name:      "test",
					Annotations: map[string]string{
						cmapi.VenafiAdoptExistingAnnotationKey: "true",
					},
				},
				Status: cmapi.CertificateStatus{
					Conditions: []cmapi.CertificateCondition{
						{
							Type:   cmapi.CertificateConditionIssuing,
							Status: cmmeta.ConditionTrue,
						},
						{
							Type:   cmapi.CertificateConditionVenafiAdoption,
							Status: cmmeta.ConditionTrue,
							Reason: "Adopted",
						},
					},
				},
			},
			expectedEvents: []string{`Normal Generated Stored new private key in temporary Secret resource "test-notrandom"`},
			expectedActions: []testpkg.Action{
				testpkg.NewAction(coretesting.NewUpdateSubresourceAction(
					cmapi.SchemeGroupVersion.WithResource("certificates"),
					"status",
					"testns",
					&cmapi.Certificate{
						ObjectMeta: metav1.ObjectMeta{Namespace: "testns", Name: "test"},
						Status: cmapi.CertificateStatus{
							NextPrivateKeySecretName: ptr.To("test-notrandom"),
							Conditions: []cmapi.CertificateCondition{
								{
									Type:   cmapi.CertificateConditionIssuing,
									Status: cmmeta.ConditionTrue,
								},
								{
									Type:   cmapi.CertificateConditionVenafiAdoption,
									Status: cmmeta.ConditionTrue,
									Reason: "Adopted",
								},
							},
						},
					},
				)),
				testpkg.NewCustomMatch(coretesting.NewCreateAction(
					corev1.SchemeGroupVersion.WithResource("secrets"),
					"testns",
					&corev1.Secret{
						ObjectMeta: metav1.ObjectMeta{
							Namespace:       "testns",
							GenerateName:    "test-",
							Labels:          map[string]string{cmapi.IsNextPrivateKeySecretLabelKey: "true", cmapi.PartOfCertManagerControllerLabelKey: "true"},
							OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(&cmapi.Certificate{ObjectMeta: metav1.ObjectMeta{Namespace: "testns", Name: "test"}}, certificateGvk)},
						},
						Data: map[string][]byte{"tls.key": nil},
					},
				), relaxedSecretMatcher),
			},
		},
		"create a secret if Venafi adoption is skipped": {
			certificate: &cmapi.Certificate{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: "testns",
					Name:      "test",
					Annotations: map[string]string{
						cmapi.VenafiAdoptExistingAnnotationKey: "true",
					},
				},
				Status: cmapi.CertificateStatus{
					Conditions: []cmapi.CertificateCondition{
						{
							Type:   cmapi.CertificateConditionIssuing,
							Status: cmmeta.ConditionTrue,
						},
						{
							Type:   cmapi.CertificateConditionVenafiAdoption,
							Status: cmmeta.ConditionFalse,
							Reason: "Skipped",
						},
					},
				},
			},
			expectedEvents: []string{`Normal Generated Stored new private key in temporary Secret resource "test-notrandom"`},
			expectedActions: []testpkg.Action{
				testpkg.NewAction(coretesting.NewUpdateSubresourceAction(
					cmapi.SchemeGroupVersion.WithResource("certificates"),
					"status",
					"testns",
					&cmapi.Certificate{
						ObjectMeta: metav1.ObjectMeta{Namespace: "testns", Name: "test"},
						Status: cmapi.CertificateStatus{
							NextPrivateKeySecretName: ptr.To("test-notrandom"),
							Conditions: []cmapi.CertificateCondition{
								{
									Type:   cmapi.CertificateConditionIssuing,
									Status: cmmeta.ConditionTrue,
								},
								{
									Type:   cmapi.CertificateConditionVenafiAdoption,
									Status: cmmeta.ConditionFalse,
									Reason: "Skipped",
								},
							},
						},
					},
				)),
				testpkg.NewCustomMatch(coretesting.NewCreateAction(
					corev1.SchemeGroupVersion.WithResource("secrets"),
					"testns",
					&corev1.Secret{
						ObjectMeta: metav1.ObjectMeta{
							Namespace:       "testns",
							GenerateName:    "test-",
							Labels:          map[string]string{cmapi.IsNextPrivateKeySecretLabelKey: "true", cmapi.PartOfCertManagerControllerLabelKey: "true"},
							OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(&cmapi.Certificate{ObjectMeta: metav1.ObjectMeta{Namespace: "testns", Name: "test"}}, certificateGvk)},
						},
						Data: map[string][]byte{"tls.key": nil},
					},
				), relaxedSecretMatcher),
			},
		},
```

---

## 3. Behavior summary

| VenafiAdoption condition | Keymanager behavior |
|---|---|
| Missing | Wait |
| `False/Pending` | Wait |
| `False/Failed` | Wait |
| `False/RequiresRotationPolicyNever` | Wait |
| `False/SearchFailed` | Wait |
| `False/PermissionDenied` | Wait |
| `False/RetrieveFailed` | Wait |
| `False/KeyMismatch` | Wait |
| `False/IdentityMismatch` | Wait |
| `False/UsageMismatch` | Wait |
| `False/CAMismatch` | Wait |
| `False/InvalidCertificate` | Wait |
| `False/Ambiguous` | Wait |
| `False/Conflict` | Wait |
| `True/Adopted` | Proceed |
| `True/AlreadyPresent` | Proceed |
| `False/Skipped` | Proceed |
| `False/Expired` | Proceed |
| `False/NotYetValid` | Proceed |
| `False/PrivateKeyUnavailable` | Proceed |
| `False/NotFound` | Proceed |
| `False/NotApplicable` | Proceed |
| `False/Renewal` | Proceed |

---

## 4. Test command

```bash
gofmt -w \
  pkg/controller/certificates/keymanager/keymanager_controller.go \
  pkg/controller/certificates/keymanager/keymanager_controller_test.go

go test ./pkg/controller/certificates/keymanager/...
```

# Phase 8 - Full Code

This document contains the complete change for Phase 8 of the Venafi TPP existing certificate adoption feature.

Scope:

- Register the Venafi adoption controller in the default controller set.
- Enable it by default. It still does nothing unless a Certificate has `venafi.cert-manager.io/adopt-existing: "true"`.

File:

- Update: `internal/apis/config/controller/v1alpha1/defaults.go`

No CRD, webhook, deepcopy, conversion, or RBAC change is required.

---

## 1. Add the import

In `internal/apis/config/controller/v1alpha1/defaults.go`, add:

```go
	venafiadoptioncontroller "github.com/cert-manager/cert-manager/pkg/controller/certificates/venafi-adoption"
```

The import block becomes:

```go
import (
	"fmt"
	"time"

	"k8s.io/apimachinery/pkg/runtime"
	logsapi "k8s.io/component-base/logs/api/v1"

	cm "github.com/cert-manager/cert-manager/pkg/apis/certmanager"
	"github.com/cert-manager/cert-manager/pkg/apis/config/controller/v1alpha1"
	sharedv1alpha1 "github.com/cert-manager/cert-manager/pkg/apis/config/shared/v1alpha1"
	challengescontroller "github.com/cert-manager/cert-manager/pkg/controller/acmechallenges"
	orderscontroller "github.com/cert-manager/cert-manager/pkg/controller/acmeorders"
	shimgatewaycontroller "github.com/cert-manager/cert-manager/pkg/controller/certificate-shim/gateways"
	shimingresscontroller "github.com/cert-manager/cert-manager/pkg/controller/certificate-shim/ingresses"
	cracmecontroller "github.com/cert-manager/cert-manager/pkg/controller/certificaterequests/acme"
	crapprovercontroller "github.com/cert-manager/cert-manager/pkg/controller/certificaterequests/approver"
	crcacontroller "github.com/cert-manager/cert-manager/pkg/controller/certificaterequests/ca"
	crselfsignedcontroller "github.com/cert-manager/cert-manager/pkg/controller/certificaterequests/selfsigned"
	crvaultcontroller "github.com/cert-manager/cert-manager/pkg/controller/certificaterequests/vault"
	crvenaficontroller "github.com/cert-manager/cert-manager/pkg/controller/certificaterequests/venafi"
	"github.com/cert-manager/cert-manager/pkg/controller/certificates/issuing"
	"github.com/cert-manager/cert-manager/pkg/controller/certificates/keymanager"
	certificatesmetricscontroller "github.com/cert-manager/cert-manager/pkg/controller/certificates/metrics"
	"github.com/cert-manager/cert-manager/pkg/controller/certificates/readiness"
	"github.com/cert-manager/cert-manager/pkg/controller/certificates/requestmanager"
	"github.com/cert-manager/cert-manager/pkg/controller/certificates/revisionmanager"
	"github.com/cert-manager/cert-manager/pkg/controller/certificates/trigger"
	venafiadoptioncontroller "github.com/cert-manager/cert-manager/pkg/controller/certificates/venafi-adoption"
	csracmecontroller "github.com/cert-manager/cert-manager/pkg/controller/certificatesigningrequests/acme"
	csrcacontroller "github.com/cert-manager/cert-manager/pkg/controller/certificatesigningrequests/ca"
	csrselfsignedcontroller "github.com/cert-manager/cert-manager/pkg/controller/certificatesigningrequests/selfsigned"
	csrvaultcontroller "github.com/cert-manager/cert-manager/pkg/controller/certificatesigningrequests/vault"
	csrvenaficontroller "github.com/cert-manager/cert-manager/pkg/controller/certificatesigningrequests/venafi"
	clusterissuerscontroller "github.com/cert-manager/cert-manager/pkg/controller/clusterissuers"
	issuerscontroller "github.com/cert-manager/cert-manager/pkg/controller/issuers"
	"github.com/cert-manager/cert-manager/pkg/util"
)
```

## 2. Add the controller to `AllControllers`

In the `AllControllers` slice, under the `// certificate controllers` block, add:

```go
		venafiadoptioncontroller.ControllerName,
```

The block becomes:

```go
		// certificate controllers
		trigger.ControllerName,
		issuing.ControllerName,
		keymanager.ControllerName,
		requestmanager.ControllerName,
		readiness.ControllerName,
		revisionmanager.ControllerName,
		venafiadoptioncontroller.ControllerName,
		// experimental CSR controllers
		csracmecontroller.CSRControllerName,
		...
```

## 3. Add the controller to `DefaultEnabledControllers`

In the `DefaultEnabledControllers` slice, under the `// certificate controllers` block, add:

```go
		venafiadoptioncontroller.ControllerName,
```

The block becomes:

```go
		// certificate controllers
		trigger.ControllerName,
		issuing.ControllerName,
		keymanager.ControllerName,
		requestmanager.ControllerName,
		readiness.ControllerName,
		revisionmanager.ControllerName,
		venafiadoptioncontroller.ControllerName,
	}
```

## 4. Full relevant section

```go
	AllControllers = []string{
		issuerscontroller.ControllerName,
		clusterissuerscontroller.ControllerName,
		certificatesmetricscontroller.ControllerName,
		shimingresscontroller.ControllerName,
		shimgatewaycontroller.ControllerName,
		orderscontroller.ControllerName,
		challengescontroller.ControllerName,
		cracmecontroller.CRControllerName,
		crapprovercontroller.ControllerName,
		crcacontroller.CRControllerName,
		crselfsignedcontroller.CRControllerName,
		crvaultcontroller.CRControllerName,
		crvenaficontroller.CRControllerName,
		// certificate controllers
		trigger.ControllerName,
		issuing.ControllerName,
		keymanager.ControllerName,
		requestmanager.ControllerName,
		readiness.ControllerName,
		revisionmanager.ControllerName,
		venafiadoptioncontroller.ControllerName,
		// experimental CSR controllers
		csracmecontroller.CSRControllerName,
		csrcacontroller.CSRControllerName,
		csrselfsignedcontroller.CSRControllerName,
		csrvenaficontroller.CSRControllerName,
		csrvaultcontroller.CSRControllerName,
	}

	DefaultEnabledControllers = []string{
		issuerscontroller.ControllerName,
		clusterissuerscontroller.ControllerName,
		certificatesmetricscontroller.ControllerName,
		shimingresscontroller.ControllerName,
		orderscontroller.ControllerName,
		challengescontroller.ControllerName,
		cracmecontroller.CRControllerName,
		crapprovercontroller.ControllerName,
		crcacontroller.CRControllerName,
		crselfsignedcontroller.CRControllerName,
		crvaultcontroller.CRControllerName,
		crvenaficontroller.CRControllerName,
		// certificate controllers
		trigger.ControllerName,
		issuing.ControllerName,
		keymanager.ControllerName,
		requestmanager.ControllerName,
		readiness.ControllerName,
		revisionmanager.ControllerName,
		venafiadoptioncontroller.ControllerName,
	}
```

## 5. Registration behavior

`pkg/controller/certificates/venafi-adoption/controller.go` contains:

```go
func init() {
	controllerpkg.Register(ControllerName, func(ctx *controllerpkg.ContextFactory) (controllerpkg.Interface, error) {
		return controllerpkg.NewBuilder(ctx, ControllerName).
			For(&controllerWrapper{}).
			Complete()
	})
}
```

Because the `defaults.go` package imports the adoption controller package, its `init()` runs and the controller is registered.

The controller is enabled by default because `Controllers` defaults to `["*"]`, which expands to `AllControllers`.

## 6. RBAC

No new RBAC is expected. The controller uses:

- `get`, `list`, `watch` on Certificates and Secrets;
- `get`, `list`, `watch` on Issuers and ClusterIssuers;
- `get`, `create`, `update` on Secrets;
- `get`, `update` on Certificate status.

These permissions are already part of the cert-manager controller ClusterRole. Verify after building:

```bash
grep -A 5 -B 2 "certificates/status" deploy/charts/cert-manager/templates/rbac.yaml || true
```

If the generated ClusterRole is missing Secrets create/update or Certificate status update for this controller, the same permissions are already required by keymanager and issuing, so no change should be necessary.

## 7. Tests

No new test file is required for Phase 8. The existing defaults test uses `"controllers": ["*"]`, so adding the controller to the lists does not change `testdata/defaults.json`.

Run:

```bash
gofmt -w internal/apis/config/controller/v1alpha1/defaults.go

go test ./internal/apis/config/controller/v1alpha1/...
```

Expected result:

- The package compiles.
- The defaults test passes.
- The controller is present in `AllControllers` and `DefaultEnabledControllers`.

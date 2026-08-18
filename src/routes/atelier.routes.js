import { Router } from "express";
import { validateSchema } from "../middlewares/validator.middleware.js";
import * as schema from "../schemas/atelier.schema.js";
import * as ctrl from "../controllers/atelier.controller.js";
import * as files from "../controllers/atelier.files.controller.js";

const router = Router();

router.post("/auth/register", validateSchema(schema.registerSchema), ctrl.register);
router.post("/auth/login", validateSchema(schema.loginSchema), ctrl.login);
router.get("/auth/me", ctrl.authAtelier, ctrl.me);
router.patch("/auth/profile", ctrl.authAtelier, ctrl.requireRole("cliente"), validateSchema(schema.clientProfileSchema), ctrl.updateClientProfile);

router.get("/categories", ctrl.listCategories);
router.get("/creators", ctrl.listCreators);
router.get("/creators/:slug", ctrl.getCreatorBySlug);
router.get("/creators/:slug/services", ctrl.listCreatorServices);
router.get("/creators/:slug/portfolio", ctrl.listCreatorPortfolio);

router.patch("/creator/profile", ctrl.authAtelier, ctrl.requireRole("creador"), validateSchema(schema.creatorProfileSchema), ctrl.updateCreatorProfile);
router.get("/creator/services", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.listOwnServices);
router.post("/creator/services", ctrl.authAtelier, ctrl.requireRole("creador"), validateSchema(schema.serviceSchema), ctrl.createService);
router.put("/creator/services/:id_service", ctrl.authAtelier, ctrl.requireRole("creador"), validateSchema(schema.serviceSchema), ctrl.updateService);
router.delete("/creator/services/:id_service", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.deleteService);
router.get("/creator/portfolio", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.listOwnPortfolio);
router.post("/creator/portfolio", ctrl.authAtelier, ctrl.requireRole("creador"), validateSchema(schema.portfolioSchema), ctrl.createPortfolioItem);
router.put("/creator/portfolio/:id_item", ctrl.authAtelier, ctrl.requireRole("creador"), validateSchema(schema.portfolioSchema), ctrl.updatePortfolioItem);
router.delete("/creator/portfolio/:id_item", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.deletePortfolioItem);
router.get("/creator/board", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.listIncomingRequests);
router.get("/creator/requests", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.listIncomingRequests);
router.get("/creator/requests/:id_request", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.getRequest);
router.get("/creator/requests/:id_request/quotes", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.listRequestQuotes);
router.post("/creator/requests/:id_request/quotes", ctrl.authAtelier, ctrl.requireRole("creador"), validateSchema(schema.quoteSchema), ctrl.createQuote);
router.get("/creator/orders", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.listOwnOrders);
router.post("/creator/orders/:id_order/start", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.startOrder);
router.get("/creator/wallet", ctrl.authAtelier, ctrl.requireRole("creador"), ctrl.getCreatorWallet);

router.post("/client/requests", ctrl.authAtelier, ctrl.requireRole("cliente"), validateSchema(schema.requestSchema), ctrl.createRequest);
router.get("/client/requests", ctrl.authAtelier, ctrl.requireRole("cliente"), ctrl.listMyRequests);
router.get("/client/requests/:id_request", ctrl.authAtelier, ctrl.requireRole("cliente"), ctrl.getRequest);
router.get("/client/requests/:id_request/quotes", ctrl.authAtelier, ctrl.requireRole("cliente"), ctrl.listRequestQuotes);
router.post("/client/quotes/:id_quote/accept", ctrl.authAtelier, ctrl.requireRole("cliente"), ctrl.acceptQuote);
router.post("/client/quotes/:id_quote/reject", ctrl.authAtelier, ctrl.requireRole("cliente"), ctrl.rejectQuote);
router.get("/client/orders", ctrl.authAtelier, ctrl.requireRole("cliente"), ctrl.listMyOrders);

router.get("/orders/:id_order", ctrl.authAtelier, ctrl.getOrder);
router.patch("/orders/:id_order/transition", ctrl.authAtelier, validateSchema(schema.transitionSchema), ctrl.transitionOrder);
router.get("/orders/:id_order/messages", ctrl.authAtelier, ctrl.listMessages);
router.post("/orders/:id_order/messages", ctrl.authAtelier, validateSchema(schema.messageSchema), ctrl.postMessage);
router.post("/orders/:id_order/attachments", ctrl.authAtelier, validateSchema(schema.attachmentSchema), ctrl.addAttachment);
router.post("/orders/:id_order/revisions", ctrl.authAtelier, ctrl.requireRole("cliente"), validateSchema(schema.revisionSchema), ctrl.requestRevision);
router.post("/orders/:id_order/review", ctrl.authAtelier, ctrl.requireRole("cliente"), validateSchema(schema.reviewSchema), ctrl.addReview);

router.post("/files/auth", ctrl.authAtelier, validateSchema(schema.fileAuthSchema), files.createFileAuth);
router.post("/files", ctrl.authAtelier, validateSchema(schema.fileConfirmSchema), files.confirmFile);
router.get("/files/:uuid/preview-url", ctrl.authAtelier, files.getFilePreviewUrl);
router.get("/files/:uuid/download-url", ctrl.authAtelier, files.getFileDownloadUrl);

router.post("/orders/:id_order/checkout", ctrl.authAtelier, ctrl.requireRole("cliente"), ctrl.createCheckout);
router.post("/payments/webhook", ctrl.paymentWebhook);

router.get("/admin/users", ctrl.authAtelier, ctrl.requireRole("admin"), ctrl.listUsers);
router.get("/admin/orders", ctrl.authAtelier, ctrl.requireRole("admin"), ctrl.listOrders);
router.get("/admin/kpis", ctrl.authAtelier, ctrl.requireRole("admin"), ctrl.dashboardKpis);
router.get("/admin/commission", ctrl.authAtelier, ctrl.requireRole("admin"), ctrl.getCommissionRule);
router.post("/admin/commission-rules", ctrl.authAtelier, ctrl.requireRole("admin"), validateSchema(schema.commissionRuleSchema), ctrl.setCommissionRule);

export default router;

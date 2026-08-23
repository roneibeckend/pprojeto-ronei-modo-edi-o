import { renderAdminReportEmail } from "/dev-server/src/lib/admin-report-email.server";
const d: any = {
  reportType: "Relatório Diário", formattedDate: "23/08/2026", generatedAt: "18:00",
  environment: "producao", dateStr: "2026-08-23",
  totalRevenue: 1200, grossRevenue: 1300, totalFees: 100, salesCount: 3, newStudents: 2,
  invoicesCreated: {count:3,value:1300}, paymentsConfirmed:{count:3,value:1200}, pendingPayments:{count:1,value:200},
  refunds:{count:0,value:0}, avgTicket:400, netProfit:1000, margin:80,
  usersActive:10, usersCanceled:0, leads:5, courseEnrollments:4, affiliatesActive:2,
  affiliateSales:{count:1,commission:100}, delta:{revenue:10,sales:5,users:null,affiliateSales:0,commission:2},
  topCourse:{title:"X",views:5}, topEbook:{title:"Y",downloads:3}, totalViews:50, ebookEnrollments:8,
  errors:{count:0,samples:[]}, emails:{failed:0,sent:5}, payoutsPending:{count:0,value:0},
  tickets:{open:0,created:0,closed:0}, abandonedCheckouts:0,
};
const r = await renderAdminReportEmail(d);
await Bun.write("/tmp/rep/out.html", r.html);
console.log(r.html.length, r.html.slice(0,600));

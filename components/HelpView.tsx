import React from 'react';
import { ArrowRightIcon } from './icons';

interface HelpViewProps {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-10">
        <h2 className="text-2xl font-bold text-sky-700 border-b pb-2 mb-4">{title}</h2>
        <div className="space-y-4">{children}</div>
    </section>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-6">
        <h3 className="text-xl font-semibold text-sky-600 mb-2">{title}</h3>
        <div className="space-y-3 pr-4 border-r-2 border-slate-200">{children}</div>
    </div>
);

const Alert: React.FC<{ type: 'info' | 'warning' | 'danger'; children: React.ReactNode }> = ({ type, children }) => {
    const baseClasses = "p-4 rounded-lg border-r-4";
    const typeClasses = {
        info: "bg-sky-50 border-sky-500 text-sky-800",
        warning: "bg-amber-50 border-amber-500 text-amber-800",
        danger: "bg-red-50 border-red-500 text-red-800",
    };
    return <div className={`${baseClasses} ${typeClasses[type]}`}>{children}</div>;
};

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <code className="bg-slate-200 text-slate-800 px-2 py-1 rounded-md text-sm" dir="ltr">{children}</code>
);

export const HelpView: React.FC<HelpViewProps> = ({ onBack }) => {
    return (
        <div className="space-y-6">
            <div className="relative text-center">
                <div className="absolute top-1/2 -translate-y-1/2 right-0">
                    <button onClick={onBack} title="بازگشت" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-sky-600 transition-colors">
                        <ArrowRightIcon className="w-6 h-6" />
                    </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">راهنما و توافق‌نامه</h1>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm text-slate-700 leading-relaxed text-justify">
                <header className="text-center border-b pb-4 mb-8">
                    <p className="text-sm text-slate-500">طراحی: رحمان شیخ‌هادی - مشاور منطقه کهک</p>
                </header>

                <main>
                    <Section title="مقدمه و توافق‌نامه">
                        <SubSection title="این برنامه چگونه کار می‌کند؟ (تکنولوژی PWA)">
                            <p>این برنامه یک <strong>«اپلیکیشن وب پیش‌رونده» (PWA)</strong> است. این یعنی شما آن را مانند یک وب‌سایت در مرورگر خود باز می‌کنید، اما می‌تواند مانند یک اپلیکیشن واقعی روی گوشی یا کامپیوتر شما نصب شود و به صورت آفلاین کار کند.</p>
                            <Alert type="info">
                                <strong>مهم‌ترین نکته:</strong> تمام اطلاعات شما (شامل لیست دانش‌آموزان، جلسات، یادداشت‌ها و عکس‌ها) به صورت کاملاً خصوصی و امن، فقط و فقط روی <strong>حافظه داخلی مرورگر دستگاه شما</strong> ذخیره می‌شود و به هیچ سرور آنلاینی ارسال نمی‌گردد.
                                <br />
                                <strong>مثال:</strong> این برنامه مانند یک دفترچه یادداشت دیجیتال است که روی کامپیوتر شما قرار دارد. هیچ‌کس جز شما به آن دسترسی ندارد، مگر اینکه خودتان از آن پشتیبان بگیرید یا از قابلیت همگام‌سازی ابری (که اختیاری است) استفاده کنید.
                            </Alert>
                        </SubSection>
                        <SubSection title="مسئولیت استفاده و ریسک‌ها (توافق‌نامه)">
                             <ul className="list-disc list-outside pr-5 space-y-2">
                                <li><strong>مسئولیت داده‌ها:</strong> از آنجایی که تمام اطلاعات روی دستگاه شما ذخیره می‌شود، مسئولیت حفظ و نگهداری آن‌ها، از جمله <strong>تهیه فایل پشتیبان به صورت منظم</strong>، کاملاً بر عهده شماست. در صورت بروز هرگونه مشکل برای دستگاه یا مرورگر شما (مانند حذف شدن، خرابی و...)، توسعه‌دهنده هیچ مسئولیتی در قبال از بین رفتن اطلاعات شما نخواهد داشت.</li>
                                <li><strong>استفاده با مسئولیت شخصی:</strong> شما با مسئولیت کامل خود از این نرم‌افزار استفاده می‌کنید.</li>
                                <li><strong>قابلیت همگام‌سازی ابری (اختیاری):</strong> این برنامه یک قابلیت <strong>اختیاری</strong> برای همگام‌سازی اطلاعات بین چند دستگاه از طریق سرویس ثالثی به نام <strong>Supabase</strong> ارائه می‌دهد. استفاده از این قابلیت به معنای پذیرش قوانین و سیاست‌های حریم خصوصی آن سرویس است. هرچند این سرویس امن است، اما به هر حال داده‌های شما (به صورت رمزنگاری‌نشده) روی یک سرور ابری ذخیره خواهد شد. مسئولیت استفاده از این قابلیت و ریسک‌های احتمالی آن بر عهده کاربر است.</li>
                            </ul>
                        </SubSection>
                    </Section>
                    
                    <Section title="داشبورد">
                        <p>داشبورد صفحه اصلی شماست و یک نمای کلی از فعالیت‌هایتان ارائه می‌دهد:</p>
                        <ul className="list-disc list-outside pr-5 space-y-2">
                          <li><strong>آرشیو جلسات:</strong> با کلیک روی این گزینه، به لیست تمام جلسات گذشته دسترسی پیدا می‌کنید. اگر برای برنامه رمز گذاشته باشید، این بخش قفل است و برای ورود باید رمز را وارد کنید.</li>
                          <li><strong>جلسات پیش رو:</strong> ۵ جلسه آینده شما در اینجا نمایش داده می‌شود. با کلیک روی هر جلسه، به آن روز در تقویم منتقل می‌شوید تا جزئیات را ببینید.</li>
                        </ul>
                    </Section>
                    
                    <Section title="دانش‌آموزان">
                        <p>این بخش قلب برنامه است و برای مدیریت کامل دانش‌آموزان طراحی شده است.</p>
                        <SubSection title="دکمه‌های اصلی:">
                            <ul className="list-disc list-outside pr-5 space-y-2">
                                <li><strong>ورود اکسل:</strong> سریع‌ترین راه برای کلاس‌بندی دانش‌آموزان.
                                    <Alert type="info">
                                        <strong>مثال:</strong> یک فایل اکسل بسازید. نام هر شیت (Sheet) را نام کلاس بگذارید (مثلاً «هفتم ایثار»). در هر شیت، ستون اول را به کد ملی دانش‌آموزان آن کلاس اختصاص دهید. برنامه به صورت هوشمند کلاس‌های جدید را می‌سازد و دانش‌آموزان را بر اساس کد ملی به کلاس مربوطه منتقل می‌کند.
                                    </Alert>
                                </li>
                                <li><strong>افزودن:</strong> برای اضافه کردن یک دانش‌آموز به صورت دستی.</li>
                                <li><strong>مدیریت کلاس‌ها:</strong> در این بخش می‌توانید کلاس‌های مدرسه را تعریف، ویرایش یا حذف کنید.</li>
                                <li><strong>کلاس‌بندی دستی:</strong> دانش‌آموزانی که هنگام ورود اطلاعات، کلاسی به آن‌ها اختصاص داده نشده (مثلاً از طریق اکسل وارد شده‌اند اما کلاس‌بندی نشده‌اند)، در این بخش لیست می‌شوند تا شما به صورت دستی آن‌ها را به کلاس مورد نظر منتقل کنید.</li>
                            </ul>
                        </SubSection>
                        <SubSection title="لیست دانش‌آموزان">
                            <ul className="list-disc list-outside pr-5 space-y-2">
                                <li><strong>جستجو و فیلتر:</strong> می‌توانید بر اساس نام, کد ملی یا کلاس, دانش‌آموزان را جستجو کنید.</li>
                                <li><strong>خروجی لیست کلاس (آیکون پرینت):</strong> وقتی یک کلاس را از منوی فیلتر انتخاب می‌کنید، آیکون پرینت فعال می‌شود. با کلیک بر روی آن، یک <strong>لیست حضور و غیاب ماهانه</strong> بسیار شکیل و حرفه‌ای برای آن کلاس در فرمت HTML تحویل می‌گیرید که آماده چاپ است.</li>
                            </ul>
                        </SubSection>
                    </Section>
                    
                    <Section title="بخش بیشتر">
                        <p>این بخش شامل ابزارهای تخصصی و گزارشات تکمیلی است.</p>
                        <ul className="list-disc list-outside pr-5 space-y-2">
                            <li><strong>دانش‌آموزان خاص:</strong> لیستی از دانش‌آموزان نیازمند توجه ویژه را در اینجا ثبت کنید (مثلاً مشکلات جسمی، والدین مطلقه و...). این بخش با رمز عبور محافظت می‌شود.</li>
                            <li><strong>نیازمند مشاوره:</strong> یک لیست کاری برای خودتان بسازید. دانش‌آموزانی که فکر می‌کنید نیاز به جلسه مشاوره دارند را به همراه دلیل به این لیست اضافه کنید تا فراموش نشوند.</li>
                            <li><strong>تفکر و سبک زندگی:</strong> مجموعه‌ای کامل از ابزارها برای این درس خاص:
                                <ul className="list-['-_'] list-outside pr-5 space-y-2 mt-2">
                                    <li><strong>کلاس‌ها:</strong> انتخاب کنید در کدام کلاس‌ها این درس را تدریس می‌کنید.</li>
                                    <li><strong>گروه‌بندی:</strong> دانش‌آموزان کلاس را انتخاب و به گروه‌های مختلف تقسیم کنید. می‌توانید از گروه‌بندی خود خروجی HTML بگیرید.</li>
                                    <li><strong>ثبت مشاهدات:</strong> بر اساس ۲۰ معیار مشخص، به هر دانش‌آموز نمره دهید. با یک کلیک می‌توانید برای یک دانش‌آموز در همه موارد نمره ۵ ثبت کنید. همچنین می‌توانید یک خروجی HTML مقایسه‌ای بسیار قدرتمند از دانش‌آموزان منتخب خود بگیرید.</li>
                                    <li><strong>ارزشیابی:</strong> نمرات فعالیت کلاسی، پروژه و امتحان را وارد کنید تا نمره نهایی (از ۲۰) به صورت خودکار محاسبه شود.</li>
                                </ul>
                            </li>
                            <li><strong>حد نصاب نهم:</strong> ابزاری دقیق برای محاسبه نمره نهایی دروس جهت هدایت تحصیلی. کافیست رشته مورد نظر را انتخاب کرده و نمرات پایه‌های هفتم، هشتم و نهم را وارد کنید تا نمره نهایی محاسبه شود.</li>
                            <li><strong>گزارشات:</strong> آمار دقیقی از تعداد جلسات برگزار شده بر اساس نوع جلسه، کلاس و بازه زمانی دلخواه خود تهیه کنید.</li>
                        </ul>
                    </Section>

                    <Section title="تنظیمات">
                        <p>تمام جنبه‌های برنامه را از این بخش سفارشی‌سازی کنید.</p>
                        <SubSection title="عمومی">
                            <ul className="list-disc list-outside pr-5 space-y-2">
                              <li><strong>سال تحصیلی فعال:</strong> سال تحصیلی مورد نظر را انتخاب کنید. تمام اطلاعات برنامه (دانش‌آموزان، کلاس‌ها، جلسات) بر اساس سال انتخابی فیلتر می‌شوند.</li>
                              <li><strong>کلید API هوش مصنوعی:</strong> برای استفاده از قابلیت‌های هوشمند مانند «خلاصه‌سازی» و «پیشنهاد اقدام»، باید کلید API خود را از سرویس Google Gemini دریافت کرده و در این فیلد وارد کنید. این قابلیت کاملاً اختیاری است.</li>
                            </ul>
                        </SubSection>
                        <SubSection title="ظاهری">
                            <p>اندازه فونت برنامه را تغییر دهید و از ابزارهای اصلاح نویسه برای یکسان‌سازی کاراکترهای عربی و فارسی (مثل «ی» و «ک») استفاده کنید.</p>
                        </SubSection>
                        <SubSection title="امنیتی">
                            <p>برای بخش‌های حساس برنامه (آرشیو جلسات، دانش‌آموزان خاص و نیازمند مشاوره) یک رمز عبور عددی (۴ تا ۸ رقم) تنظیم کنید.</p>
                        </SubSection>
                        <SubSection title="مدیریت داده‌ها">
                            <Alert type="danger">
                                <strong>هشدار جدی:</strong> همیشه قبل از هرگونه عملیات در این بخش (مخصوصاً بازیابی و حذف)، از اطلاعات خود یک فایل <strong>پشتیبان</strong> تهیه کنید.
                            </Alert>
                             <ul className="list-disc list-outside pr-5 space-y-2 mt-4">
                                <li><strong>پشتیبان‌گیری:</strong> یک فایل فشرده (<Code>.zip</Code>) از تمام اطلاعات شما (شامل عکس‌ها) تهیه می‌کند. این فایل را در جایی امن نگهداری کنید.</li>
                                <li><strong>بازیابی پشتیبان:</strong> تمام اطلاعات فعلی برنامه را <strong>پاک کرده</strong> و اطلاعات فایل پشتیبان را جایگزین می‌کند.</li>
                                <li><strong>دریافت عکس از سیدا:</strong> این ابزار دو مرحله‌ای است:
                                    <ol className="list-decimal list-outside pr-5 space-y-1 mt-2">
                                        <li><strong>مرحله اول:</strong> لینک عکس تمام دانش‌آموزان فاقد عکس را برای شما تولید می‌کند.</li>
                                        <li><strong>مرحله دوم:</strong> لینک‌های تولید شده را کپی کرده و با استفاده از یک افزونه مدیریت دانلود در مرورگر (مانند Simple Mass Downloader)، تمام عکس‌ها را در یک پوشه دانلود کنید. سپس به تب «ورود از پوشه محلی» در همین پنجره بروید و پوشه دانلود شده را انتخاب کنید تا عکس‌ها به صورت خودکار به دانش‌آموزان متناظرشان اختصاص یابند.</li>
                                    </ol>
                                </li>
                                <li><strong>حذف داده‌ها:</strong> تمام اطلاعات برنامه را برای همیشه حذف می‌کند. <strong>این عمل غیرقابل بازگشت است.</strong></li>
                            </ul>
                        </SubSection>
                        <SubSection title="همگام‌سازی ابری (Supabase)">
                            <p>این قابلیت به شما اجازه می‌دهد اطلاعات برنامه را بین چند دستگاه (مثلاً کامپیوتر محل کار و گوشی شخصی) همگام‌سازی کنید.</p>
                            <Alert type="warning">
                                <strong>پیش‌نیاز:</strong> برای استفاده از این قابلیت، به یک حساب کاربری رایگان در سایت <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase.com</a> نیاز دارید.
                            </Alert>
                            <h4 className="font-semibold text-lg mt-4">راهنمای راه‌اندازی اولیه:</h4>
                             <ol className="list-decimal list-outside pr-5 space-y-1 mt-2">
                                <li>به سایت <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase.com</a> بروید و یک حساب کاربری رایگان بسازید.</li>
                                <li>پس از ورود، یک پروژه جدید (New Project) ایجاد کنید. نام و رمز عبور پایگاه داده را به دلخواه وارد کنید.</li>
                                <li>پس از ساخته شدن پروژه، به بخش <strong>Project Settings</strong> (آیکون چرخ‌دنده در منوی سمت چپ) و سپس به تب <strong>API</strong> بروید.</li>
                                <li>در این صفحه، دو مقدار مهم وجود دارد:
                                    <ul className="list-['-_'] list-outside pr-5 space-y-1 mt-2">
                                        <li><strong>Project URL:</strong> این آدرس را کپی کنید.</li>
                                        <li><strong>Project API Keys:</strong> از این قسمت، کلید <Code>public</Code> که با <Code>anon</Code> مشخص شده را کپی کنید.</li>
                                    </ul>
                                </li>
                                <li>به برنامه «همیار مشاور» برگردید. در تنظیمات بخش «مدیریت داده‌ها»، مقادیر کپی شده را در فیلدهای «آدرس پروژه» و «کلید عمومی» جای‌گذاری کرده و روی <strong>«ذخیره و آزمایش اتصال»</strong> کلیک کنید.</li>
                            </ol>
                            <h4 className="font-semibold text-lg mt-4">نحوه استفاده:</h4>
                            <ul className="list-disc list-outside pr-5 space-y-2">
                                <li><strong>ورود / ثبت‌نام:</strong> پس از تنظیم اتصال، با ایمیل و رمز عبور دلخواه خود یک حساب کاربری بسازید. (باید ایمیل خود را برای اولین بار تایید کنید).</li>
                                <li><strong>ارسال به فضای ابری:</strong> اطلاعات دستگاه فعلی شما را روی سرور ابری ذخیره می‌کند و اطلاعات قبلی روی سرور را بازنویسی می‌کند.</li>
                                <li><strong>دریافت از فضای ابری:</strong> اطلاعات ذخیره شده روی سرور ابری را دانلود و جایگزین اطلاعات فعلی دستگاه شما می‌کند.</li>
                            </ul>
                            <Alert type="info">
                                <strong>مثال کاربردی:</strong> شما روی کامپیوتر خود چند جلسه جدید ثبت می‌کنید. پس از اتمام کار، روی «ارسال به فضای ابری» کلیک می‌کنید. روز بعد، برنامه را روی گوشی خود باز کرده، وارد حساب کاربری خود شده و روی «دریافت از فضای ابری» کلیک می‌کنید. اکنون تمام جلسات جدید روی گوشی شما نیز در دسترس هستند.
                            </Alert>
                        </SubSection>
                    </Section>
                </main>
            </div>
        </div>
    );
};

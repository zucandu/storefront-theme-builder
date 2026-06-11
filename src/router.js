import { createRouter, createWebHistory } from 'vue-router';
import Storefront from '@theme/Storefront.vue';
const Index      = () => import('@theme/storefront/Index.vue');
const Login      = () => import('@theme/storefront/Login.vue');
const Register   = () => import('@theme/storefront/Register.vue');
const Logout     = () => import('@theme/storefront/Logout.vue');
const Cart       = () => import('@theme/storefront/Cart.vue');
const Checkout   = () => import('@theme/storefront/Checkout.vue');
const CheckoutSuccess   = () => import('@theme/storefront/CheckoutSuccess.vue');
const ContactUs         = () => import('@theme/storefront/ContactUs.vue');
const TrackOrderForm    = () => import('@theme/storefront/TrackOrderForm.vue');
const TrackOrderDetails = () => import('@theme/storefront/TrackOrderDetails.vue');
const TrackOrder        = () => import('@theme/storefront/TrackOrder.vue');
const ReturnExchange    = () => import('@theme/storefront/ReturnExchange.vue');
const ReturnExchangeForm    = () => import('@theme/storefront/ReturnExchangeForm.vue');
const ReturnExchangeProcess = () => import('@theme/storefront/ReturnExchangeProcess.vue');
const PasswordForgotten = () => import('@theme/storefront/PasswordForgotten.vue');
const PasswordReset     = () => import('@theme/storefront/PasswordReset.vue');
const Invoice      = () => import('@theme/storefront/Invoice.vue');
const Unsubscribe  = () => import('@theme/storefront/Unsubscribe.vue');
const PageNotFound = () => import('@theme/storefront/PageNotFound.vue');
const Account      = () => import('@theme/storefront/Account.vue');
const AccountProfile        = () => import('@theme/storefront/AccountProfile.vue');
const AccountPassword       = () => import('@theme/storefront/AccountPassword.vue');
const AccountAddressBook    = () => import('@theme/storefront/AccountAddressBook.vue');
const AccountAddressBookNew = () => import('@theme/storefront/AccountAddressBookNew.vue');
const AccountAddressBookEdit= () => import('@theme/storefront/AccountAddressBookEdit.vue');
const AccountOrderList      = () => import('@theme/storefront/AccountOrderList.vue');
const AccountOrderDetails   = () => import('@theme/storefront/AccountOrderDetails.vue');
const AccountWishlist       = () => import('@theme/storefront/AccountWishlist.vue');
const Category          = () => import('@theme/storefront/Category.vue');
const Manufacturer      = () => import('@theme/storefront/Manufacturer.vue');
const SearchResult      = () => import('@theme/storefront/SearchResult.vue');
const Product           = () => import('@theme/storefront/Product.vue');
const ProductReviewWrite= () => import('@theme/storefront/ProductReviewWrite.vue');
const ArticleDetails    = () => import('@theme/storefront/ArticleDetails.vue');
const Blog        = () => import('@theme/storefront/Blog.vue');
const BlogListing = () => import('@theme/storefront/BlogListing.vue');
const BlogSearch  = () => import('@theme/storefront/BlogSearch.vue');
const BlogCategory= () => import('@theme/storefront/BlogCategory.vue');
const BlogAuthor  = () => import('@theme/storefront/BlogAuthor.vue');
const PaymentRequest = () => import('@theme/storefront/PaymentRequest.vue');

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: Storefront,
            children: [
                { path: '', name: 'index', component: Index },
                { path: 'login', name: 'login', component: Login },
                { path: 'register', name: 'register', component: Register },
                { path: 'logout', name: 'logout', component: Logout },
                { path: 'cart', name: 'cart', component: Cart },
                { path: 'checkout', name: 'checkout', component: Checkout },
                { path: 'checkout-success/:ref', name: 'checkout_success', component: CheckoutSuccess },
                { path: 'contact-us', name: 'contact_us', component: ContactUs },
                { path: 'forgot-password', name: 'forgot_password', component: PasswordForgotten },
                { path: 'reset-password/:token', name: 'reset_password', component: PasswordReset },
                { path: 'invoice/:ref', name: 'invoice', component: Invoice },
                { path: 'pay/:token', name: 'pay', component: PaymentRequest },
                { path: 'unsubscribe', name: 'unsubscribe', component: Unsubscribe },
                { path: 'page-not-found', name: 'page_not_found', component: PageNotFound },
                { path: 'product/:slug', name: 'product', component: Product },
                { path: 'product-review-write/:slug', name: 'product_review_write', component: ProductReviewWrite },
                { path: 'category/:slug', name: 'category', component: Category },
                { path: 'manufacturer/:slug', name: 'manufacturer', component: Manufacturer },
                { path: 'search/result', name: 'search', component: SearchResult },
                { path: 'article/:slug', name: 'article_details', component: ArticleDetails },
                {
                    path: 'account', name: 'account',
                    redirect: { name: 'account_order_list' },
                    component: Account,
                    children: [
                        { path: 'profile', name: 'account_profile', component: AccountProfile },
                        { path: 'order/list', name: 'account_order_list', component: AccountOrderList },
                        { path: 'order/:ref', name: 'account_order_details', component: AccountOrderDetails },
                        { path: 'password', name: 'account_password', component: AccountPassword },
                        { path: 'wishlist', name: 'account_wishlist', component: AccountWishlist },
                        { path: 'address-book', name: 'account_address_book', component: AccountAddressBook },
                        { path: 'address-book/new', name: 'account_address_book_new', component: AccountAddressBookNew },
                        { path: 'address-book/:id', name: 'account_address_book_edit', component: AccountAddressBookEdit },
                    ],
                },
                {
                    path: 'track-order', name: 'track_order',
                    redirect: { name: 'track_order_form' },
                    component: TrackOrder,
                    children: [
                        { path: 'form', name: 'track_order_form', component: TrackOrderForm },
                        { path: ':ref', name: 'track_order_details', component: TrackOrderDetails },
                    ],
                },
                {
                    path: 'return-exchange', name: 'return_exchange',
                    redirect: { name: 'return_exchange_form' },
                    component: ReturnExchange,
                    children: [
                        { path: 'form', name: 'return_exchange_form', component: ReturnExchangeForm },
                        { path: ':ref', name: 'return_exchange_process', component: ReturnExchangeProcess },
                    ],
                },
                {
                    path: 'blog', name: 'blog',
                    redirect: { name: 'blog_listing' },
                    component: Blog,
                    children: [
                        { path: 'listing', name: 'blog_listing', component: BlogListing },
                        { path: 'search', name: 'blog_search', component: BlogSearch },
                        { path: 'category/:slug', name: 'blog_category', component: BlogCategory },
                        { path: 'author/:slug', name: 'blog_author', component: BlogAuthor },
                    ],
                },
                { path: ':pathMatch(.*)*', redirect: '/page-not-found' },
            ],
        },
    ],
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        return { top: 0 };
    },
});

export default router;

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Row, Col, Alert } from 'react-bootstrap';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { Link } from 'react-router-dom';
import Product from '../components/Product';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginate from '../components/Paginate';
import ProductCarousel from '../components/ProductCarousel';
import Meta from '../components/Meta';

const HomeScreen = () => {
  const { pageNumber, keyword } = useParams();
  const location = useLocation();
  const { data, isLoading, error } = useGetProductsQuery({
    keyword,
    pageNumber,
  });

  const [reviewSentiment, setReviewSentiment] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Retrieve sentiment from localStorage (if not already displayed in this session)
    const sentiment = localStorage.getItem('reviewSentiment');
    if (sentiment && !sessionStorage.getItem('sentimentShown')) {
      setReviewSentiment(sentiment);
      sessionStorage.setItem('sentimentShown', 'true'); // Prevents repeated display in the session
      setTimeout(() => setShowBanner(true), 500); // Smooth fade-in effect
    }
  }, [location]);

  const renderBanner = () => {
    if (!reviewSentiment || !showBanner) return null;

    let bannerText;
    let variant;

    if (reviewSentiment === 'negative') {
      bannerText = 'We’re sorry about your experience! Here’s a special discount just for you!';
      variant = 'danger';
    } else if (reviewSentiment === 'neutral') {
      bannerText = 'Check out our upcoming offers and make your next experience even better!';
      variant = 'info';
    } else if (reviewSentiment === 'positive') {
      bannerText = 'Welcome back! We love having you here ❤️';
      variant = 'success';
    }

    return (
      <Alert variant={variant} className="text-center fade-in-banner">
        {bannerText}
      </Alert>
    );
  };

  return (
    <>
      {!keyword ? (
        <ProductCarousel />
      ) : (
        <Link to='/' className='btn btn-light mb-4'>
          Go Back
        </Link>
      )}

      {renderBanner()}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <Meta />
          <h1>Latest Products</h1>
          <Row>
            {data.products.map((product) => (
              <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
                <Product product={product} />
              </Col>
            ))}
          </Row>
          <Paginate
            pages={data.pages}
            page={data.page}
            keyword={keyword ? keyword : ''}
          />
        </>
      )}
    </>
  );
};

export default HomeScreen;

import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/l5.jpeg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl ml-[-180px] mt-[-100px]">
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#ffb703' }}>
              Welcome to EazyEats
            </h1>
            <h2 className="text-2xl md:text-3xl text-white/90 font-medium mb-4">
              A Canteen At Your Fingertip
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
              Get your favorite meals hot and fresh without any delay. Fast, affordable, and reliable service, every time!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link 
                to="/menu" 
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg text-center"
              >
                Order Now
              </Link>
            </div>
            
            {/* Login Options */}
           
          </div>
        </div>
      </div>
    </div>
  );
}

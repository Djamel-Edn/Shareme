"use client";
import React, { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { FaCameraRetro } from "react-icons/fa6";
import Link from "next/link";

interface Pin {
  id: number;
  image: string;
  title: string;
  description: string;
  category: string;
  creator: {
    username: string;
    profile_picture: string;
  };
}



export default function CategoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ category:string }>()
  console.log(params)
  const  category  = params?.category[0];
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pins/category/?category=${category}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          }
        });

        if (response.status === 401) {
          signOut();
          router.push('/login');
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error('Failed to fetch data');
        if (data.error) {
          console.error('Error fetching category pins:', data.error);
          return;
        }
        setPins(data);
      } catch (error) {
        console.error('Category fetch error:', error);
      }
    };

    fetchData();
  }, [session, category,router]);

  if (status === 'loading') {
    return <div className='spinner'></div>;
  }
console.log(pins)
  return (
    <div className='flex flex-col min-h-screen'>
      <header className='flex justify-between items-center gap-32 px-4 py-2'>
        <div className='flex flex-col gap-1'>
        <Link href={'/'} className='flex gap-2 items-center'>
            <FaCameraRetro className='text-3xl' />
            <h1 className='text-3xl'>Shareme</h1>
          </Link>
          <span className='text-xl'>Discover new ideas</span>
        </div>
        <div className='flex gap-2'>
          <a href='/profile'>
            <img src={session?.user?.image ?? 'data:image/png;base64,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'} alt="Profile Picture" width={50} height={50} className='rounded-full' />
          </a>
          <button onClick={() => signOut()} className='border-2 border-gray-200 rounded-lg px-4 py-2'>Sign Out</button>
        </div>
      </header>

      <main className='flex p-4 flex-grow'>
        <aside className="w-[10%] px-3 py-2 border-r-2 border-gray-200">
          <ul className='ml-2'>
            <li><Link href="gaming" className="hover:text-gray-400 transition-colors">Gaming</Link></li>
            <li><Link href="work" className="hover:text-gray-400 transition-colors">Work</Link></li>
            <li><Link href="nature" className="hover:text-gray-400 transition-colors">Nature</Link></li>
            <li><Link href="car" className="hover:text-gray-400 transition-colors">Car</Link></li>
            <li><Link href="sky" className="hover:text-gray-400 transition-colors">Sky</Link></li>
            <li><Link href="family" className="hover:text-gray-400 transition-colors">Family</Link></li>
            <li><Link href="home" className="hover:text-gray-400 transition-colors">Home</Link></li>
            <li><Link href="art" className="hover:text-gray-400 transition-colors">Art</Link></li>
            <li><Link href="design" className="hover:text-gray-400 transition-colors">Design</Link></li>
            <li><Link href="education" className="hover:text-gray-400 transition-colors">Education</Link></li>
            <li><Link href="science" className="hover:text-gray-400 transition-colors">Science</Link></li>
            <li><Link href="travel" className="hover:text-gray-400 transition-colors">Travel</Link></li>
            <li><Link href="food" className="hover:text-gray-400 transition-colors">Food</Link></li>
            <li><Link href="fitness" className="hover:text-gray-400 transition-colors">Fitness</Link></li>
            <li><Link href="technology" className="hover:text-gray-400 transition-colors">Technology</Link></li>
            <li><Link href="books" className="hover:text-gray-400 transition-colors">Books</Link></li>
            <li><Link href="photography" className="hover:text-gray-400 transition-colors">Photography</Link></li>
            <li><Link href="fashion" className="hover:text-gray-400 transition-colors">Fashion</Link></li>
            <li><Link href="music" className="hover:text-gray-400 transition-colors">Music</Link></li>
          </ul>
        </aside>
        <section className="flex-grow px-3 py-2">
          <h2 className="text-2xl font-bold mb-4">{category.charAt(0).toUpperCase() + category.slice(1)} Pins</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pins?.map((pin, index) => (
              <div
                key={pin.id}
                className={`relative rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105`}
                style={{ height: (index === 0 || index === 2 || index === 4) ? '450px' : '300px' }}
              >
                <Link href={`/pin/${pin.id}`}>
                  <img
                    src={pin.image}
                    alt={pin.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </Link>
                <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white p-2">
                  <h3 className="text-lg font-semibold">{pin.title}</h3>
                  <p className="text-sm truncate">{pin.description}</p>
                <div className="flex items-center mt-2">
                  <Link href={`/profile/${pin.creator.username}`}>
                    <img
                      src={pin.creator.profile_picture}
                      alt={pin.creator.username}
                      className="w-8 h-8 rounded-full mr-2"
                      />
                    <span className="text-sm">{pin.creator.username}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-black text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Shareme. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

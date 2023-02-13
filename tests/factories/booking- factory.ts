import faker from "@faker-js/faker";
import { prisma } from "@/config";

type CreateBookingParams = {
    roomId: number,
    userId: number,
  }

export async function createBooking({ roomId, userId }: CreateBookingParams) {
    return prisma.booking.create({
        data: {
            userId,
            roomId
        }
    });
}
import type { NextFunction, Request, Response } from 'express'
import { ContentService } from '../services/content.service'

export class ContentController {
  constructor(private readonly contentService: ContentService = new ContentService()) {}

  private getSlugParam(req: Request): string {
    const slugParam = req.params.slug
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
    return slug ?? ''
  }

  listBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.contentService.listBlog(req.query)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.contentService.getBlogBySlug(this.getSlugParam(req))
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  createContactMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.contentService.createContactMessage(req.body)
      res.status(201).json({ data })
    } catch (error) {
      next(error)
    }
  }

  subscribeNewsletter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.contentService.subscribeNewsletter(req.body)
      res.status(201).json({ data })
    } catch (error) {
      next(error)
    }
  }

  createClubLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.contentService.createClubLead(req.body)
      res.status(201).json({ data })
    } catch (error) {
      next(error)
    }
  }
}

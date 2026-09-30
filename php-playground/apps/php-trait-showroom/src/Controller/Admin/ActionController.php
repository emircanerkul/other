<?php

namespace App\Controller\Admin;

use App\Entity\RepositoryEntity;
use App\Entity\TraitEntity;
use App\Form\ActionType;
use App\Repository\RepositoryEntityRepository;
use App\Repository\TraitEntityRepository;
use App\Service\TraitFinder;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Translation\TranslatableMessage;

class ActionController extends AbstractController
{
    #[Route(path:'/actions', name: 'admin_actions')]
    public function index(Request $request, TraitFinder $traitFinder, RepositoryEntityRepository $repositoryEntityRepository, TraitEntityRepository $traitEntityRepository, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(ActionType::class, []);
        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($form->getClickedButton()) {
                switch ($form->getClickedButton()->getName()) {
                    case 'field_submit_run_repository_explorer_all':
                        foreach ($repositoryEntityRepository->findAll() as $repositoryEntity) {
                            $id = $repositoryEntity->getId();
                            $owner = $repositoryEntity->getOwner();
                            $repository = $repositoryEntity->getRepository();
                            $version = $repositoryEntity->getVersion();

                            foreach ($traitEntityRepository->findBy(['repositoryEntity' => $id]) as $trait) {
                                $entityManager->remove($trait);
                            }

                            foreach ($traitFinder->findAllFiles($owner, $repository, $version) as $file) {
                                $trait = new TraitEntity();
                                $trait->setRepositoryEntity($repositoryEntity);
                                $trait->setCode($traitFinder->getFileContent($file));
                                $entityManager->persist($trait);
                            }
                            $repositoryEntity->increaseScanCount();
                            $repositoryEntity->setLastScan(new DateTime());
                            $entityManager->persist($repositoryEntity);
                            $entityManager->flush();
                        }
                        $this->addFlash('success', 'All repositories successfully explored.');
                        break;
                    case 'field_submit_run_repository_explorer_selected':
                        /**
                         * @var RepositoryEntity
                         */
                        $selectedRepository = $form->get('field_repository')->getData();

                        if (!$selectedRepository instanceof RepositoryEntity) {
                            $this->addFlash('danger', 'Please select a repository');
                            break;
                        }

                        foreach ($traitEntityRepository->findBy(['repositoryEntity' => $selectedRepository]) as $trait) {
                            $entityManager->remove($trait);
                        }

                        foreach ($traitFinder->findAllFiles($selectedRepository->getOwner(), $selectedRepository->getRepository(), $selectedRepository->getVersion()) as $file) {
                            $trait = new TraitEntity();
                            $trait->setRepositoryEntity($selectedRepository);
                            $trait->setCode($traitFinder->getFileContent($file));
                            $entityManager->persist($trait);
                        }

                        $selectedRepository->increaseScanCount();
                        $selectedRepository->setLastScan(new DateTime());
                        $entityManager->persist($selectedRepository);
                        $entityManager->flush();

                        $flashMessage = new TranslatableMessage(
                            '%owner%/%repository%/%version% repository successfully explored.',
                            [
                                '%owner%' => $selectedRepository->getOwner(),
                                '%repository%' => $selectedRepository->getRepository(),
                                '%version%' => $selectedRepository->getVersion()
                            ]
                        );

                        $this->addFlash('success', $flashMessage);
                        break;
                    default:
                        break;
                }
            }
        }

        return $this->renderForm('action/index.html.twig', [
            'form' => $form,
        ]);
    }
}
